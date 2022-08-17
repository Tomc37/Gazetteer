<?php

  	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

  $countryCode = $_REQUEST['countryCode'];
   
  $result = file_get_contents("https://thomascockerill.co.uk/project1/libs/util/countryBorders.geo.json");
	$features = $decode->features;
	$filtered = array_values(array_filter($features, function($value) use ($countryCode) {
		if ($value->properties->iso_a2 == $countryCode) {
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