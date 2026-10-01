<?php 
/*
=====================================
REGISTRO DE VISITAS - 2026
=====================================
*/
require_once(__DIR__ . "/../api/db.php");

function get_device() {
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $mobile_patterns = '/iPhone|iPad|Android|webOS|BlackBerry|iPod|Symbian|Windows Phone/i';
    return preg_match($mobile_patterns, $ua) ? "mobile" : "desktop";
}

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$ua = $_SERVER['HTTP_USER_AGENT'] ?? 'Unknown';

// Registrar visita
$dispositivo = get_device();
if (isset($conn)) {
    $stmt = mysqli_prepare($conn, "INSERT INTO $dispositivo (ip, useragent) VALUES (?, ?)");
    if ($stmt) {
        mysqli_stmt_bind_param($stmt, "ss", $ip, $ua);
        mysqli_stmt_execute($stmt);
    }
}

// Se nao houver ID, redirecionar para pagina inicial
if (!isset($_GET["id"])) {
    header("Location: ../index.php");
    exit();
}

$id = addslashes($_GET["id"]);

// Redirecionar para o produto, onde o Anti-Crawler v1 será acionado
header("Location: ../produto.php?produto=$id");
exit();
?>
