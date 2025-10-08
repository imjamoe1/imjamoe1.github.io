let body = JSON.parse($response.body);
body.premium_account = true;
$done({body: JSON.stringify(body)});