<?
// oma.php

if (!isset($_GET['request']) || !isset($_GET['type'])) {
	exit;
}

$request = json_decode($_GET['request']);

if ($_GET['type'] === 'script') {
	echo "OMA.lastmessage = " . json_encode('false');
} else if ($_GET['type'] === 'json') {
	echo json_encode('false');
}