<?php
header('Content-Type: application/json; charset=utf-8');

$dsn = 'sqlite:' . __DIR__ . '/data/expenses.db';
try {
    $pdo = new PDO($dsn, null, null, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database connection failed.']);
    exit;
}

initialize_database($pdo);

$action = $_GET['action'] ?? 'list';
$input = json_decode(file_get_contents('php://input'), true) ?? [];

switch ($action) {
    case 'add':
        addExpense($pdo, $input);
        break;
    case 'delete':
        deleteExpense($pdo, $input);
        break;
    case 'list':
    default:
        listExpenses($pdo);
        break;
}

function initialize_database(PDO $pdo): void
{
    $pdo->exec('CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        expense_date TEXT NOT NULL,
        amount REAL NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )');
}

function addExpense(PDO $pdo, array $input): void
{
    $description = trim($input['description'] ?? '');
    $category = trim($input['category'] ?? '');
    $amount = $input['amount'] ?? null;
    $date = $input['date'] ?? '';

    if ($description === '' || $category === '' || $amount === null || $date === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'All fields are required.']);
        return;
    }

    if (!is_numeric($amount) || $amount <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Amount must be a positive number.']);
        return;
    }

    $stmt = $pdo->prepare('INSERT INTO expenses (description, category, expense_date, amount) VALUES (:description, :category, :date, :amount)');
    $stmt->execute([
        ':description' => $description,
        ':category' => $category,
        ':date' => $date,
        ':amount' => $amount,
    ]);

    echo json_encode(['success' => true, 'message' => 'Expense added.']);
}

function deleteExpense(PDO $pdo, array $input): void
{
    $id = $input['id'] ?? null;
    if ($id === null || !is_numeric($id)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Valid expense ID is required.']);
        return;
    }

    $stmt = $pdo->prepare('DELETE FROM expenses WHERE id = :id');
    $stmt->execute([':id' => (int)$id]);

    echo json_encode(['success' => true, 'message' => 'Expense deleted.']);
}

function listExpenses(PDO $pdo): void
{
    $stmt = $pdo->query('SELECT id, description, category, expense_date, amount FROM expenses ORDER BY expense_date DESC, id DESC');
    $expenses = $stmt->fetchAll();

    echo json_encode(['success' => true, 'data' => $expenses]);
}
