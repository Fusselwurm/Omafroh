<?
// oma.php

/**
* usage: send GET type=json to get a json object or
*                 type=script to get the json object into OMA.lastmessage
*
* the request JSON looks like this
*   action: (checkList|add|remove)
*   if action === checkList,
*       imgs: <array of urls>
*   if action === addImage|removeImage,
*       url: <url>
*
*/
error_reporting(E_ALL);

header('Content-type: application/x-javascript');

function lib_has_file ($url) {
	$f = file_get_contents(DB_FILE_NAME);
	if (strpos($f, $url) !== false) {
		return true;
	}
	return false;
}

function lib_append ($url) {
	$f = fopen(DB_FILE_NAME, 'a');
	fwrite($f, $url."\n");
	fclose($f);
}

define('DB_FILE_NAME', 'database.txt');
if (!file_exists(DB_FILE_NAME)) {
	die('*sterb*');
}

if (!isset($_GET['request']) || !isset($_GET['type'])) {
	exit;
}

$request = json_decode(stripslashes($_GET['request']), true);
$response = false;

// var_dump($_GET['request']);
// var_dump($request);

// check image list with existing list...
if ($request['action'] === 'checkList') {
	if (!is_array($request['urls'])) {
		$response = array(
			'status' => 'error',
			'message' => 'no imgs array provided'
		);
	}

	$response = array(
		'status' => 'ok',
		'imgs' => array()
	);
	$addedImages = file(DB_FILE_NAME, FILE_IGNORE_NEW_LINES);
	foreach ($request['urls'] as $img) {
		$ok = false;
		foreach ($addedImages as $available) {
			if ($img === $available) {
				$response['imgs'][] = array(
					'url' => $img,
					'state' => 'inlist'
				);
				$ok = true;
				break;
			}
		}
		if (!$ok) {
			$response['imgs'][] = array(
				'url' => $img,
				'state' => 'notinlist'
			);
		}
	}
} else if ($request['action'] === 'add') {
	if (!isset($request['url'])) {
		$response = array(
			'status' => 'error',
			'message' => 'state an url to add'
		);
	} else {
		if (lib_has_file($request['url'])) {
			$response = array(
				'status' => 'fail',
				'message' => 'url already exists: '.$request['url']
			);
		} else {
			lib_append($request['url']);
			$response = array(
				'status' => 'ok',
				'message' => 'file added'
			);
		}
	}
} else {
	$response = array(
		'status' => 'error',
		'message' => 'unknown action'
	);
}


// encode and send response

if ($_GET['type'] === 'script') {
	echo "OMA.lastmessage = " . json_encode($response);
} else if ($_GET['type'] === 'json') {
	echo json_encode($response);
}