<?php

  	ini_set('display_errors', 'On');
	error_reporting(E_ALL);

	$executionStartTime = microtime(true);

  $result = file_get_contents("https://thomascockerill.co.uk/project1/libs/util/countryBorders.geo.json");
	$decode = json_decode("$result");
  $countryNames = array();
  foreach ($decode->features as $value) {
    array_push($countryNames, array("name"=>$value->properties->name, "code"=>$value->properties->iso_a2));
  };

	$output['status']['code'] = "200";
	$output['status']['name'] = "ok";
	$output['status']['description'] = "success";
	$output['status']['returnedIn'] = intval((microtime(true) - $executionStartTime) * 1000) . " ms";
	$output['data'] = $countryNames;
	
	header('Content-Type: application/json; charset=UTF-8');

	echo json_encode($output);

	?>