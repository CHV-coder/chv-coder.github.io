function ready(fn) {
  if (document.readyState !== 'loading'){
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

function addDemo(row) {
  if (!row.Issued && !row.Due) {
    for (const key of ['Number', 'Issued', 'Due']) {
      if (!row[key]) { row[key] = key; }
    }
    for (const key of ['Subtotal', 'Deduction', 'Taxes', 'Total']) {
      if (!(key in row)) { row[key] = key; }
    }
    if (!('Note' in row)) { row.Note = '(Все, что есть в колонке примечаний, попадает сюда)'; }
  }
  if (!row.Invoicer) {
    row.Invoicer = {
      Name: 'Invoicer.Name',
      Street1: 'Invoicer.Street1',
      Street2: 'Invoicer.Street2',
      City: 'Invoicer.City',
      State: '.State',
      Zip: '.Zip',
      Email: 'Invoicer.Email',
      Phone: 'Invoicer.Phone',
      Website: 'Invoicer.Website'
    }
  }
  if (!row.Client) {
    row.Client = {
      Name: 'Client.Name',
      Street1: 'Client.Street1',
      Street2: 'Client.Street2',
      City: 'Client.City',
      State: '.State',
      Zip: '.Zip'
    }
  }
  if (!row.Items) {
    row.Items = [
      {
        Description: 'Items[0].Description',
        Quantity: '.Quantity',
        Total: '.Total',
        Price: '.Price',
      },
      {
        Description: 'Items[1].Description',
        Quantity: '.Quantity',
        Total: '.Total',
        Price: '.Price',
      },
    ];
  }
  return row;
}

const data = {
  count: 0,
  invoice: '',
  status: 'waiting',
  tableConnected: false,
  rowConnected: false,
  haveRows: false,
};
let app = undefined;

Vue.filter('currency', formatNumberAsRUB);

function formatNumberAsRUB(value) {
  if (typeof value !== "number") {
    return value || '—'; // ложное значение будет отображено в виде прочерка.
  }
  value = Math.round(value * 100) / 100; // Округлить до ближайшего цента.
  value = (value === -0 ? 0 : value); // Избегайте отрицательного нуля.

  const result = value.toLocaleString('ru-RU', {
    style: 'currency',
    currency: 'RUB'
  });

  if (result.includes('NaN')) {
    return value;
  }
  return result;
}

Vue.filter('fallback', function(value, str) {
  if (!value) {
    throw new Error("Пожалуйста, предоставьте колонку " + str);
  }
  return value;
});

// Устанавливаем русскую локаль для moment.js
moment.locale('ru');

Vue.filter('asDate', function(value) {
  if (typeof(value) === 'number') {
    value = new Date(value * 1000);
  }
  const date = moment.utc(value);
  return date.isValid() ? date.format('DD MMMM, YYYY') : value;
});

function tweakUrl(url) {
  if (!url) { return url; }
  if (url.toLowerCase().startsWith('http')) {
    return url;
  }
  return 'https://' + url;
};

function handleError(err) {
  console.error(err);
  const target = app || data;
  target.invoice = '';
  target.status = String(err).replace(/^Error: /, '');
  console.log(data);
}

function prepareList(lst, order) {
  if (order) {
    let orderedLst = [];
    const remaining = new Set(lst);
    for (const key of order) {
      if (remaining.has(key)) {
        remaining.delete(key);
        orderedLst.push(key);
      }
    }
    lst = [...orderedLst].concat([...remaining].sort());
  } else {
    lst = [...lst].sort();
  }
  return lst;
}

function updateInvoice(row) {
  try {
    data.status = '';
    if (row === null) {
      throw new Error("(Нет данных - не в строке - пожалуйста, добавьте или выберите строку)");
    }
    console.log("GOT...", JSON.stringify(row));
    if (row.References) {
      try {
        Object.assign(row, row.References);
      } catch (err) {
        throw new Error('Не удалось понять столбец ссылок. ' + err);
      }
    }

    // Add some guidance about columns.
    const want = new Set(Object.keys(addDemo({})));
    const accepted = new Set(['References']);
    const importance = ['Number', 'Client', 'Items', 'Total', 'Invoicer', 'Due', 'Issued', 'Subtotal', 'Deduction', 'Taxes', 'Note'];
    if (!(row.Due || row.Issued)) {
      const seen = new Set(Object.keys(row).filter(k => k !== 'id' && k !== '_error_'));
      const help = row.Help = {};
      help.seen = prepareList(seen);
      const missing = [...want].filter(k => !seen.has(k));
      const ignoring = [...seen].filter(k => !want.has(k) && !accepted.has(k));
      const recognized = [...seen].filter(k => want.has(k) || accepted.has(k));
      if (missing.length > 0) {
        help.expected = prepareList(missing, importance);
      }
      if (ignoring.length > 0) {
        help.ignored = prepareList(ignoring);
      }
      if (recognized.length > 0) {
        help.recognized = prepareList(recognized);
      }
      if (!seen.has('References') && !(row.Issued || row.Due)) {
        row.SuggestReferencesColumn = true;
      }
    }
    addDemo(row);
    if (!row.Subtotal && !row.Total && row.Items && Array.isArray(row.Items)) {
      try {
        row.Subtotal = row.Items.reduce((a, b) => a + b.Price - b.Quantity, 0);
        row.Total = row.Subtotal + (row.Taxes || 0) - (row.Deduction || 0);
      } catch (e) {
        console.error(e);
      }
    }
    if (row.Invoicer && row.Invoicer.Website && !row.Invoicer.Url) {
      row.Invoicer.Url = tweakUrl(row.Invoicer.Website);
    }

    // Повозиться с обновлением Vue (я не эксперт).
    for (const key of want) {
      Vue.delete(data.invoice, key);
    }
    for (const key of ['Help', 'SuggestReferencesColumn', 'References']) {
      Vue.delete(data.invoice, key);
    }
    data.invoice = Object.assign({}, data.invoice, row);

    // Сделайте информацию об отчете доступной для отладки.
    window.invoice = row;
  } catch (err) {
    handleError(err);
  }
}

ready(function() {
  // Обновляйте отчет всякий раз, когда меняются данные документа.
  grist.ready();
  grist.onRecord(updateInvoice);

  // Следите за состоянием, чтобы мы могли давать советы пользователям.
  grist.on('message', msg => {
    // Если нам сообщают о таблице, но не указывают, к какой строке следует обращаться, проверьте
    // количество строк.  В данный момент, если таблица пуста, а "выбрать по" - это
    // не установлено, функция on Record() никогда не будет вызвана.
    if (msg.tableId && !app.rowConnected) {
      grist.docApi.fetchSelectedTable().then(table => {
        if (table.id && table.id.length >= 1) {
          app.haveRows = true;
        }
      }).catch(e => console.log(e));
    }
    if (msg.tableId) { app.tableConnected = true; }
    if (msg.tableId && !msg.dataChange) { app.RowConnected = true; }
  });

  Vue.config.errorHandler = function (err, vm, info)  {
    handleError(err);
  };

  app = new Vue({
    el: '#app',
    data: data
  });

  if (document.location.search.includes('demo')) {
    updateInvoice(exampleData);
  }
  if (document.location.search.includes('labels')) {
    updateInvoice({});
  }
});