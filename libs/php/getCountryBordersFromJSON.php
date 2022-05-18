<?php

  	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

  $countryName = $_REQUEST['countryName'];
   
  $result = file_get_contents("..\util\countryBorders.geo.json");
	$decode = json_decode("$result");
	$features = $decode->features;
	$filtered = array_values(array_filter($features, function($value) use ($countryName) {
		if ($value->properties->name == $countryName) {
			return true;
		} else {
			return false;
		}
	}));

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $filtered[0];
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

	?>