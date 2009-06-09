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

define('PASSWD', 'grmlblubb');
define('DB_FILE_NAME', 'database.txt');
define('CACHE_FILE_NAME', 'cache/database.txt');

// functions

function lib_has_file($url) {
	$f = file_get_contents(DB_FILE_NAME);
	if (strpos($f, $url) !== false) {
		return true;
	}
	return false;
}

function lib_append($url) {
	$f = fopen(DB_FILE_NAME, 'a');
	fwrite($f, $url."\n");
	fclose($f);
}

function lib_remove($url) {
	$f = fopen(DB_FILE_NAME, 'r');
	$newf = '';
	while ($l = fgets($f)) {
		if (strpos(trim($l), $url) !== 0) {
			$newf .= $l;
		}
	}
	fclose($f);
	$f = fopen(CACHE_FILE_NAME, 'w');
	fwrite($f, $newf);
	fclose($f);
	if (copy(CACHE_FILE_NAME, DB_FILE_NAME)) {
		unlink(CACHE_FILE_NAME);
	}
}


// file & parameter checks

if (!isset($_GET['passwd']) || ($_GET['passwd'] !== PASSWD)) {
	exit;
}

if (!file_exists(DB_FILE_NAME)) {
	@touch(DB_FILE_NAME);
	if (!file_exists(DB_FILE_NAME)) {
		echo json_encode(array('status' => 'error', 'message' => 'cannot write database file'));
		exit;
	}
}
if (!is_writable(DB_FILE_NAME)) {
	echo json_encode(array('status' => 'error', 'message' => 'cannot write to database file'));
	exit;
}

if (!file_exists(CACHE_FILE_NAME)) {
	@touch(CACHE_FILE_NAME);
	if (!file_exists(CACHE_FILE_NAME)) {
		echo json_encode(array('status' => 'error', 'message' => 'cannot write cache file'));
		exit;
	}
}

if (!is_writable(CACHE_FILE_NAME)) {
	echo json_encode(array('status' => 'error', 'message' => 'cannot write to cache file'));
	exit;
}

if (!isset($_GET['request']) || !isset($_GET['type'])) {
	exit;
}



$request = json_decode(stripslashes($_GET['request']), true);

$response = array(
	'status' => 'unknown',
	'message' => 'do not know what to do'
);

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
} else if ($request['action'] === 'remove') {
	if (!isset($request['url'])) {
		$response = array(
			'status' => 'error',
			'message' => 'state an url to remove'
		);
	} else {
		if (lib_has_file($request['url'])) {
			$tmp = lib_remove($request['url']);
			if ($tmp) {
				$response = array(
					'status' => 'ok',
					'message' => 'file removed'
				);
			} else {
				$response = array(
					'status' => 'error',
					'message' => 'could not copy from cache to db o.O'
				);
			}
		} else {
			$response = array(
				'status' => 'error',
				'message' => 'url to remove not found'
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