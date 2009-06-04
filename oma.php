<?
// oma.php

if (!isset($_GET['request'])) {
	exit;
}

$request = json_decode($_GET['request']);

echo "OMA.lastmessage = " . json_encode('false');