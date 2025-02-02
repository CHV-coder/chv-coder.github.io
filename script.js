// Функция для проверки готовности документа
function ready(fn) {
  if (document.readyState !== 'loading') {
    fn();
  } else {
    document.addEventListener('DOMContentLoaded', fn);
  }
}

// Основная функция для обновления данных на странице
function updateData(row) {
  try {
    // Проверяем, есть ли данные в строке
    if (row === null) {
      throw new Error("Нет данных для отображения. Пожалуйста, выберите строку.");
    }

    console.log("Получены данные:", JSON.stringify(row));

    // Обновляем период и название организации
    const periodElement = document.getElementById("period");
    const organizationElement = document.getElementById("organization");

    if (row.startPeriod && row.endPeriod) {
      periodElement.textContent = `За период: ${row.startPeriod} - ${row.endPeriod}`;
    } else {
      periodElement.textContent = "Период не указан";
    }

    if (row.organization) {
      organizationElement.textContent = `Название организации: ${row.organization}`;
    } else {
      organizationElement.textContent = "Название организации не указано";
    }

    // Обновляем таблицу остатков и движения средств
    const balanceTableBody = document.querySelector("#balanceTable tbody");
    balanceTableBody.innerHTML = ""; // Очищаем таблицу перед обновлением

    if (row.startBalance && row.income && row.expense && row.endBalance) {
      const balanceRow = document.createElement("tr");
      balanceRow.innerHTML = `
        <td>${row.startBalance}</td>
        <td>${row.income}</td>
        <td>${row.expense}</td>
        <td>${row.endBalance}</td>
      `;
      balanceTableBody.appendChild(balanceRow);
    } else {
      balanceTableBody.innerHTML = `<tr><td colspan="4">Данные по остаткам отсутствуют</td></tr>`;
    }

    // Обновляем таблицу движения денежных средств
    const ddsTableBody = document.querySelector("#ddsTable tbody");
    ddsTableBody.innerHTML = ""; // Очищаем таблицу перед обновлением

    if (row.ddsData && Array.isArray(row.ddsData)) {
      row.ddsData.forEach(item => {
        const ddsRow = document.createElement("tr");
        ddsRow.innerHTML = `
          <td>${item.date || ""}</td>
          <td>${item.counterparty || ""}</td>
          <td>${item.description || ""}</td>
          <td>${item.product || ""}</td>
          <td>${item.city || ""}</td>
          <td>${item.price || ""}</td>
          <td>${item.quantity || ""}</td>
        `;
        ddsTableBody.appendChild(ddsRow);
      });
    } else {
      ddsTableBody.innerHTML = `<tr><td colspan="7">Данные по движению денежных средств отсутствуют</td></tr>`;
    }
  } catch (err) {
    console.error("Ошибка при обновлении данных:", err);
    const errorElement = document.createElement("div");
    errorElement.textContent = `Ошибка: ${err.message}`;
    errorElement.style.color = "red";
    document.body.appendChild(errorElement);
  }
}

// Инициализация приложения
ready(function () {
  // Подключаемся к Grist
  grist.ready();

  // Обрабатываем данные при изменении строки
  grist.onRecord(function (record) {
    updateData(record);
  });

  // Обрабатываем ошибки
  grist.on('message', function (msg) {
    if (msg.tableId && !msg.dataChange) {
      console.log("Таблица подключена, но данные не изменились.");
    }
  });

  // Добавляем обработчик для кнопки "Печать"
  const printButton = document.getElementById("printButton");
  if (printButton) {
    printButton.addEventListener("click", function () {
      window.print();
    });
  }

  // Обработка ошибок Vue (если используется)
  if (typeof Vue !== 'undefined') {
    Vue.config.errorHandler = function (err, vm, info) {
      console.error("Ошибка Vue:", err);
    };
  }
});