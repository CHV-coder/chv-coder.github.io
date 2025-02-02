document.addEventListener("DOMContentLoaded", function() {
    // Данные из Table4 (Период и Название организации)
    const table4Data = [
        { startPeriod: "2023-01-01", endPeriod: "2023-12-31", organization: "ООО Ромашка" }
    ];

    // Данные из Table15 (Остатки и движение средств)
    const table15Data = [
        { startBalance: 100000, income: 50000, expense: 30000, endBalance: 120000 }
    ];

    // Данные из DDS (Движение денежных средств)
    const ddsData = [
        { date: "2023-01-15", counterparty: "ИП Иванов", description: "Поставка товара", product: "Товар А", city: "Москва", price: 1000, quantity: 10 },
        { date: "2023-02-20", counterparty: "ООО Лето", description: "Услуги", product: "Услуга Б", city: "Санкт-Петербург", price: 500, quantity: 5 }
    ];

    // Заполнение периода и названия организации
    const periodElement = document.getElementById("period");
    periodElement.textContent = `За период: ${table4Data[0].startPeriod} - ${table4Data[0].endPeriod}`;

    const organizationElement = document.getElementById("organization");
    organizationElement.textContent = `Название организации: ${table4Data[0].organization}`;

    // Заполнение таблицы остатков и движения средств
    const balanceTableBody = document.querySelector("#balanceTable tbody");
    table15Data.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.startBalance}</td>
            <td>${item.income}</td>
            <td>${item.expense}</td>
            <td>${item.endBalance}</td>
        `;
        balanceTableBody.appendChild(row);
    });

    // Заполнение таблицы движения денежных средств
    const ddsTableBody = document.querySelector("#ddsTable tbody");
    ddsData.forEach(item => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${item.date}</td>
            <td>${item.counterparty}</td>
            <td>${item.description}</td>
            <td>${item.product}</td>
            <td>${item.city}</td>
            <td>${item.price}</td>
            <td>${item.quantity}</td>
        `;
        ddsTableBody.appendChild(row);
    });
});