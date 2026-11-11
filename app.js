const expenseForm = document.getElementById('expenseForm');
const expenseTableBody = document.getElementById('expenseTableBody');
const totalAmountEl = document.getElementById('totalAmount');
const last30DaysEl = document.getElementById('last30Days');
const refreshBtn = document.getElementById('refreshBtn');

async function fetchExpenses() {
    try {
        const response = await fetch('api.php?action=list');
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || 'Unable to load expenses.');
        }

        renderExpenses(result.data);
    } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to load expenses.');
    }
}

function renderExpenses(expenses) {
    expenseTableBody.innerHTML = '';
    let total = 0;
    let total30 = 0;
    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    expenses.forEach(expense => {
        total += Number(expense.amount);
        const expenseDate = new Date(expense.expense_date);
        if (expenseDate >= thirtyDaysAgo) {
            total30 += Number(expense.amount);
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${escapeHtml(expense.description)}</td>
            <td>${escapeHtml(expense.category)}</td>
            <td>${formatDate(expense.expense_date)}</td>
            <td>$${Number(expense.amount).toFixed(2)}</td>
            <td><button type="button" data-id="${expense.id}">Delete</button></td>
        `;
        row.querySelector('button').addEventListener('click', () => deleteExpense(expense.id));
        expenseTableBody.appendChild(row);
    });

    totalAmountEl.textContent = `$${total.toFixed(2)}`;
    last30DaysEl.textContent = `$${total30.toFixed(2)}`;
}

function formatDate(value) {
    const date = new Date(value);
    return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function escapeHtml(value) {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

expenseForm.addEventListener('submit', async event => {
    event.preventDefault();
    const description = document.getElementById('description').value.trim();
    const amount = document.getElementById('amount').value.trim();
    const category = document.getElementById('category').value;
    const date = document.getElementById('date').value;

    if (!description || !amount || !category || !date) {
        alert('Please complete all fields.');
        return;
    }

    try {
        const response = await fetch('api.php?action=add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ description, amount, category, date })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Unable to add expense.');
        }

        expenseForm.reset();
        fetchExpenses();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to add expense.');
    }
});

async function deleteExpense(id) {
    if (!confirm('Delete this expense record?')) {
        return;
    }

    try {
        const response = await fetch('api.php?action=delete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id })
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message || 'Unable to delete expense.');
        }

        fetchExpenses();
    } catch (error) {
        console.error(error);
        alert(error.message || 'Unable to delete expense.');
    }
}

refreshBtn.addEventListener('click', fetchExpenses);
window.addEventListener('load', fetchExpenses);
