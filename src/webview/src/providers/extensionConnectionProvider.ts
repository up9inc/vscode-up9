import { v4 as uuidv4 } from 'uuid';
import {up9AuthStore} from "../stores/up9AuthStore";
import { WebViewApiMessage, MessageCommandType, ApiMessageType } from "../../../models/internal";

let isDebug = false;

//work around for running react app outside of extension
//@ts-ignore
if (!("acquireVsCodeApi" in window)) {
    //@ts-ignore
    window.acquireVsCodeApi = () => {}


    // for development
    up9AuthStore.setIsAuthConfigured(true);
    up9AuthStore.setUsername("testuser@gmail.com");
    up9AuthStore.setDefaultWorkspace("rb-reg");
    up9AuthStore.setUP9Env("stg.testr.io");
    isDebug = true;
}

//acquireVsCodeApi can only be called once per webview instance!
//@ts-ignore
const vsCodeApi = acquireVsCodeApi();

/*
since we have to rely on the "background" extension for sending our api requests (sending from panel fails on CORS),
we try to make it more convinient by handling requests with promises using this dict to hold requests with guids,
these contain events for resolving/rejecting their parent promises.
This way we can work with normal async functions despite us having to use one event listener for all panel <-> extension communications
*/
const openApiMessages = {};

export const sendApiMessage = (messageType: ApiMessageType, params: object): Promise<any> => {
    if (isDebug) {
        return getDebugReply(messageType);
    }
    return new Promise<any>((resolve, reject) => {
        const apiMessageId = uuidv4(); //unique identifier is later used by the `window.addEventListener` to trigger the correct messages's callbacks
        const apiMessage = {
            apiMessageId,
            messageType,
            params,
            onComplete: (apiResponse: any) => resolve(apiResponse),
            onError: (error: any) => reject(error)
        };
        openApiMessages[apiMessageId] = apiMessage;
        vsCodeApi.postMessage({
            apiMessageId,
            messageType,
            params,
            command: MessageCommandType.ApiRequest //used by the "background" extension to tell what kind of command this is
        } as WebViewApiMessage);
    });
}


export const getDebugReply = (apiMessageType: ApiMessageType): Promise < any > => {
    let response;
    switch (apiMessageType) {
        case ApiMessageType.Spans:
            response = [
              {
                "assertions": [
                  {
                    "expected": [
                      200
                    ],
                    "spec": "status\t"
                  },
                  {
                    "entries": 1,
                    "expected": "Glasgow",
                    "spec": "body\t\njson\t$.city"
                  }
                ],
                "ctype": "application/json",
                "depth": 0,
                "id": 29,
                "inputParameters": [
                  {
                    "knownValues": [
                      "application/hal+json"
                    ],
                    "name": "accept",
                    "spec": "accept",
                    "type": "header",
                    "uuid": "5209b911-bba2-4831-8d5e-57b351d2b3d9"
                  },
                  {
                    "knownValues": [
                      "57a98d98e4b00679b4a830b0"
                    ],
                    "name": "id",
                    "spec": "2",
                    "type": "url",
                    "uuid": "e2b55aca-53aa-4f27-bc15-da210c652f31"
                  },
                  {
                    "knownValues": [
                      "http:/addresses/57a98d98e4b00679b4a830b0"
                    ],
                    "name": "x-span-name",
                    "spec": "x-span-name",
                    "type": "header",
                    "uuid": "8f3a715a-dd82-4250-a3a8-b379b792b6ca"
                  }
                ],
                "isAuth": false,
                "kpis": {
                  "avg_rt": 0.007308941716507287,
                  "entries": 3459,
                  "err_rate": 0,
                  "failures": 0,
                  "first_seen": 1637241880.737,
                  "hits_rate": 1.9366975921553131,
                  "last_active": 1637294523.884,
                  "last_seen": 1637294523.884,
                  "sessions": 6,
                  "sum_duration": 1786.0299997329712,
                  "sum_rt": 13.053989171981812
                },
                "linksTo": [],
                "method": "get",
                "path": "/addresses/{id}",
                "service": "http://user.sock-shop",
                "serviceColorIndex": 0,
                "spanLength": 1,
                "spanParticipationCount": 0,
                "spanParticipationIds": [],
                "type": "edge",
                "uuid": "8e8b2b07-e7e0-49bd-b767-d515875a8940"
              }
            ];
            break;
        case ApiMessageType.EndpointTests:
            response = {
                "headerCode": "from up9lib import *\nfrom authentication import authenticate\n\n# logging.basicConfig(level=logging.DEBUG)\n\n",
                "tests": [{
                        "code": "    @json_dataset('data/9/dataset_9.json')\n    @clear_session({'spanId': 9})\n    def test_09_get_search(self, data_row):\n        destination, source, startDate = data_row\n\n        # GET http://trdemo-client.trdemo/search (endp 9)\n        trdemo_client_trdemo = get_http_client('http://trdemo-client.trdemo', authenticate)\n        qstr = '?' + urlencode({'destination': destination, 'endDate': '', 'source': source, 'startDate': startDate})\n        resp = trdemo_client_trdemo.get('/search' + qstr)\n        resp.assert_ok()\n        # resp.assert_status_code(200)\n        # self.assertLess(resp.elapsed.total_seconds(), 0.016)\n\n",
                        "data": [{
                            "content": "data:application/octet-stream;base64,ewogInBhcmFtZXRlcnMiOiBbCiAgewogICAibmFtZSI6ICJkZXN0aW5hdGlvbiIsCiAgICJ1dWlkIjogIjgyNjc5YzcwLWU3NTAtNDlhNi1iMGIxLTc0NTRiNmUyMWM4MCIKICB9LAogIHsKICAgIm5hbWUiOiAic291cmNlIiwKICAgInV1aWQiOiAiYWUyOGIzNjEtYTIxZS00NmRiLWIwOGYtMWY4NzgzY2QzOTcxIgogIH0sCiAgewogICAibmFtZSI6ICJzdGFydERhdGUiLAogICAidXVpZCI6ICJiYTFhZjI2Mi1hMTAxLTQyNTMtOTUxNC1hYTIxMTE5OTZhYjMiCiAgfQogXSwKICJyb3dzIjogWwogIHsKICAgImRlc3RpbmF0aW9uIjogIlNGTyIsCiAgICJzb3VyY2UiOiAiKiIsCiAgICJzdGFydERhdGUiOiAiMjAyMC0xMS0wNCIKICB9CiBdCn0=",
                            "filename": "9/dataset_9.json"
                        }],
                        "id": "04bd26e3-19cf-4ccf-b806-387491140a02",
                        "tag": "maximal",
                        "testName": "test_09_get_search",
                        "variantDisplayName": "status-200 content-text/html  smart test_09_get_search"
                    },
                    {
                        "code": "    @clear_session({'spanId': 9})\n    def test_09_get_search(self):\n        # GET http://trdemo-client.trdemo/search (endp 9)\n        destination = 'SFO'\n        source = '*'\n        startDate = '2020-11-04'\n        trdemo_client_trdemo = get_http_client('http://trdemo-client.trdemo', authenticate)\n        qstr = '?' + urlencode({'destination': destination, 'endDate': '', 'source': source, 'startDate': startDate})\n        resp = trdemo_client_trdemo.get('/search' + qstr)\n        resp.assert_ok()\n        # resp.assert_status_code(200)\n        # self.assertLess(resp.elapsed.total_seconds(), 0.016)\n\n",
                        "id": "04bd26e3-19cf-4ccf-b806-387491140a02",
                        "tag": "minimal",
                        "testName": "test_09_get_search",
                        "variantDisplayName": "status-200 content-text/html  skeleton test_09_get_search"
                    },
                    {
                        "code": "    @json_dataset('data/4/dataset_4.json')\n    @clear_session({'spanId': 4})\n    def test_04_get_cart_add(self, data_row):\n        product_id, = data_row\n\n        # GET http://trdemo-client.trdemo/cart/add (endp 4)\n        trdemo_client_trdemo = get_http_client('http://trdemo-client.trdemo', authenticate)\n        qstr = '?' + urlencode({'product_id': product_id})\n        resp = trdemo_client_trdemo.get('/cart/add' + qstr)\n        resp.assert_ok()\n        # resp.assert_status_code(302)\n        # resp.assert_cssselect('p a', expected_value='/cart')\n        # self.assertLess(resp.elapsed.total_seconds(), 0.010)\n\n",
                        "data": [{
                            "content": "data:application/octet-stream;base64,ewogInBhcmFtZXRlcnMiOiBbCiAgewogICAibmFtZSI6ICJwcm9kdWN0X2lkIiwKICAgInV1aWQiOiAiMWJhOTE3M2UtNzRjYy00ODMxLWI0ZWQtZDY1MjdjZDlkZTZkIgogIH0KIF0sCiAicm93cyI6IFsKICB7CiAgICJwcm9kdWN0X2lkIjogIkxZLTAwNyIKICB9CiBdCn0=",
                            "filename": "4/dataset_4.json"
                        }],
                        "id": "067905c9-ff41-4fb4-a1d1-a7dcbc7a3f65",
                        "tag": "maximal",
                        "testName": "test_04_get_cart_add",
                        "variantDisplayName": "status-302 content-text/html  smart test_04_get_cart_add"
                    },
                    {
                        "code": "    @clear_session({'spanId': 4})\n    def test_04_get_cart_add(self):\n        # GET http://trdemo-client.trdemo/cart/add (endp 4)\n        product_id = 'LY-007'\n        trdemo_client_trdemo = get_http_client('http://trdemo-client.trdemo', authenticate)\n        qstr = '?' + urlencode({'product_id': product_id})\n        resp = trdemo_client_trdemo.get('/cart/add' + qstr)\n        resp.assert_ok()\n        # resp.assert_status_code(302)\n        # resp.assert_cssselect('p a', expected_value='/cart')\n        # self.assertLess(resp.elapsed.total_seconds(), 0.010)\n\n",
                        "id": "067905c9-ff41-4fb4-a1d1-a7dcbc7a3f65",
                        "tag": "minimal",
                        "testName": "test_04_get_cart_add",
                        "variantDisplayName": "status-302 content-text/html  skeleton test_04_get_cart_add"
                    },
                    {
                        "code": "    @clear_session({'spanId': 12})\n    def test_12_get_flight_____2020_11_04(self):\n        # GET http://trdemo-flights.trdemo/flight/*-*/2020-11-04 (endp 12)\n        trdemo_flights_trdemo = get_http_client('http://trdemo-flights.trdemo', authenticate)\n        resp = trdemo_flights_trdemo.get('/flight/%2A-%2A/2020-11-04')\n        resp.assert_ok()\n        # resp.assert_status_code(200)\n        # resp.assert_jsonpath('$[*].date')\n        # self.assertLess(resp.elapsed.total_seconds(), 0.002)\n\n",
                        "id": "07e85a6b-e7cd-475f-9dc9-9d6e9f63dc1e",
                        "tag": "minimal",
                        "testName": "test_12_get_flight_____2020_11_04",
                        "variantDisplayName": "status-200 content-application/json  skeleton test_12_get_flight_____2020_11_04"
                    },
                    {
                        "code": "    # authentication-related test\n    @clear_session({'spanId': 6})\n    def test_06_get_login(self):\n        # GET http://trdemo-client.trdemo/login (endp 6)\n        trdemo_client_trdemo = get_http_client('http://trdemo-client.trdemo', dummy_auth)\n        resp = trdemo_client_trdemo.get('/login')\n        resp.assert_ok()\n        # resp.assert_status_code(200)\n        # resp.assert_cssselect('div#logreg-forms h1.h3.font-weight-normal', expected_value=' Select user (temp) ')\n        # resp.assert_cssselect('html head title', expected_value=' TestR Demo app ')\n        # self.assertLess(resp.elapsed.total_seconds(), 0.007)\n\n",
                        "id": "0c92223e-6555-4aca-bd9b-5f1bdc1c82d7",
                        "tag": "minimal",
                        "testName": "test_06_get_login",
                        "variantDisplayName": "status-200 content-text/html  skeleton test_06_get_login"
                    }
                ]
            };
            break;
        case ApiMessageType.EndpointsList:
            response = [
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.3603245035769549,
                    "entries": 285,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636055766.14,
                    "hits_rate": 2.376903692528646e-9,
                    "last_active": 10859515079.226,
                    "last_seen": 10859515079.226,
                    "sessions": 193,
                    "sum_duration": 119903890467.184,
                    "sum_rt": 46116860184.851845
                  },
                  "mergedEndpoints": [
                    "acd33a8d-86ed-41eb-8428-3c1c45dca68f",
                    "6dffc92f-3119-48ad-8bec-78726070bea5",
                    "896ca1d0-26ec-4e2a-b484-a7bcf920c253"
                  ],
                  "method": "post",
                  "path": "/anything",
                  "service": "http://httpbin2.trdemo",
                  "serviceEndpointHashes": [
                    "987e3bd8f985f131a825f4b21e47e698ca3cdc4e",
                    "987e3bd8f985f131a825f4b21e47e698ca3cdc4e",
                    "987e3bd8f985f131a825f4b21e47e698ca3cdc4e",
                    "987e3bd8f985f131a825f4b21e47e698ca3cdc4e"
                  ],
                  "uuid": "8e8b2b07-e7e0-49bd-b767-d515875a8940"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 1.1817450037142045e-11,
                    "entries": 69,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054818.43,
                    "hits_rate": 7.480986073505832e-9,
                    "last_active": 1636349579.74,
                    "last_seen": 1636349579.74,
                    "sessions": 41,
                    "sum_duration": 9223383030.261995,
                    "sum_rt": 0.10899686813354492
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "a20c01fa900b1863882287bd2b233481144627ea"
                  ],
                  "uuid": "2cdbfbc8-fea3-4439-9ebd-26136567f654"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.0034149288032588516,
                    "entries": 65,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054823.172,
                    "hits_rate": 0.3203027598857616,
                    "last_active": 1636055170.372,
                    "last_seen": 1636055170.372,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.6930017471313477
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/cart",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "e47c478d8acfccb464e9f7adf2d16f459f26f0ad"
                  ],
                  "uuid": "50889d6e-5eaa-4749-825c-7dc50777f1c8"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.0009658329785774187,
                    "entries": 20,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054823.169,
                    "hits_rate": 0.09855469534946512,
                    "last_active": 1636055167.621,
                    "last_seen": 1636055167.621,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.1959993839263916
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/cart/add",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "30b1488dbc765f9081a55493447dbb3baab61b21"
                  ],
                  "uuid": "067905c9-ff41-4fb4-a1d1-a7dcbc7a3f65"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.0005321932025371403,
                    "entries": 13,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054829.404,
                    "hits_rate": 0.06406055197715232,
                    "last_active": 1636055169.4459999,
                    "last_seen": 1636055169.4459999,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.10799956321716309
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/cart/remove/{flight_id}",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "9106fec1c8dfe2915ef317b845945bf1b3b0c637"
                  ],
                  "uuid": "5d74dd9c-50e5-4eb1-9327-8dc81a3b9e5b"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.00019711272731133116,
                    "entries": 6,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054820.508,
                    "hits_rate": 0.029566408604839535,
                    "last_active": 1636055171.394,
                    "last_seen": 1636055171.394,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.04000067710876465
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/login",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "4b1b251ed5310f9b2f63b46b7fa1e88eb106237f"
                  ],
                  "uuid": "0c92223e-6555-4aca-bd9b-5f1bdc1c82d7"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.00007884626578805392,
                    "entries": 6,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054820.511,
                    "hits_rate": 0.029566408604839535,
                    "last_active": 1636055171.394,
                    "last_seen": 1636055171.394,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.01600050926208496
                  },
                  "mergedEndpoints": [],
                  "method": "post",
                  "path": "/login",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "850bb42bd8269cf1a5d1c32ee6d062b795f831d8"
                  ],
                  "uuid": "133128e5-77be-4c00-84a8-e87bd445c9cb"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.0000492796504072346,
                    "entries": 5,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054831.487,
                    "hits_rate": 0.02463867383736628,
                    "last_active": 1636055170.3660002,
                    "last_seen": 1636055170.3660002,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.010000467300415039
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/logout",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "7a40cada8cb5526fd2b05c478ce123f148382ba4"
                  ],
                  "uuid": "2d2b02be-b88f-4c9d-a098-244992bd985b"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.003316369502444382,
                    "entries": 42,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054822.111,
                    "hits_rate": 0.20696486023387675,
                    "last_active": 1636055173.263,
                    "last_seen": 1636055173.263,
                    "sessions": 2,
                    "sum_duration": 202.93300008773804,
                    "sum_rt": 0.6730008125305176
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/search",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "60de32d409d840ac02c15eb4c05cfcbafa5f1e4a"
                  ],
                  "uuid": "04bd26e3-19cf-4ccf-b806-387491140a02"
                },
                {
                  "ctype": "text/html",
                  "kpis": {
                    "avg_rt": 0.00011751487656218286,
                    "entries": 2,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636055101.641,
                    "hits_rate": 0.01119194179891621,
                    "last_active": 1636055111.4229999,
                    "last_seen": 1636055111.4229999,
                    "sessions": 1,
                    "sum_duration": 178.70000004768372,
                    "sum_rt": 0.020999908447265625
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/cart/remove/BA-411",
                  "service": "http://trdemo-client.trdemo",
                  "serviceEndpointHashes": [
                    "10c905b21bb87982dbc0f21628709de4b20d4740"
                  ],
                  "uuid": "e1b47c97-9781-47eb-b884-dbf2d20e99c6"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.00017606151578540764,
                    "entries": 10,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054824.304,
                    "hits_rate": 0.09781386032436135,
                    "last_active": 1636055164.4629998,
                    "last_seen": 1636055164.4629998,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.017999649047851562
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/flight/*-*/2020-11-04",
                  "service": "http://trdemo-flights.trdemo",
                  "serviceEndpointHashes": [
                    "b6ab2c74da5794526783a7890e2c90d26091406d"
                  ],
                  "uuid": "07e85a6b-e7cd-475f-9dc9-9d6e9f63dc1e"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.000048903385424658236,
                    "entries": 5,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054827.66,
                    "hits_rate": 0.04890693016218067,
                    "last_active": 1636055166.585,
                    "last_seen": 1636055166.585,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.004999637603759766
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/flight/*-SFO/2020-11-04",
                  "service": "http://trdemo-flights.trdemo",
                  "serviceEndpointHashes": [
                    "b62f7a8fe91df69bc68d0fd3f9ec24bfc620e7f9"
                  ],
                  "uuid": "434a7396-3a63-48e6-947e-6b13b129e366"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.00010758977999840762,
                    "entries": 10,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054826.022,
                    "hits_rate": 0.09781386032436135,
                    "last_active": 1636055165.889,
                    "last_seen": 1636055165.889,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.010999441146850586
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/flight/FRA-*/2020-11-04",
                  "service": "http://trdemo-flights.trdemo",
                  "serviceEndpointHashes": [
                    "f7edaf5b5c954ba6230ac6e0b6778b64632beaee"
                  ],
                  "uuid": "f66a567c-9bf6-4374-ad66-cab984103eec"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.00012715346623243042,
                    "entries": 11,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054822.148,
                    "hits_rate": 0.10759524635679749,
                    "last_active": 1636055172.211,
                    "last_seen": 1636055172.211,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.012999534606933594
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/flight/TLV-*/2020-11-04",
                  "service": "http://trdemo-flights.trdemo",
                  "serviceEndpointHashes": [
                    "25998b172e9aee41fe32392372ed60c5241751ab"
                  ],
                  "uuid": "84b4da16-fded-4320-968e-b05c3969ff45"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.0008314018614382205,
                    "entries": 64,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054823.173,
                    "hits_rate": 0.6260087060759126,
                    "last_active": 1636055169.643,
                    "last_seen": 1636055169.643,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.08499836921691895
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/cart/{email}",
                  "service": "http://trdemo-shoppingcart.trdemo",
                  "serviceEndpointHashes": [
                    "5d222f9f285c4d40ada98a70403167403835dbeb"
                  ],
                  "uuid": "c0deca46-05f5-4d9a-afff-13f9305f33a6"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.0005281938756128609,
                    "entries": 13,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054828.676,
                    "hits_rate": 0.12715801842166974,
                    "last_active": 1636055167.593,
                    "last_seen": 1636055167.593,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.053999900817871094
                  },
                  "mergedEndpoints": [],
                  "method": "put",
                  "path": "/cart/{email}",
                  "service": "http://trdemo-shoppingcart.trdemo",
                  "serviceEndpointHashes": [
                    "503f6c1821c4e9cfc14f3216a1f77aad140c7898"
                  ],
                  "uuid": "62ecbf85-9412-4549-85fe-8c617e8d776d"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.0004597268039541799,
                    "entries": 15,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054828.679,
                    "hits_rate": 0.14672079048654202,
                    "last_active": 1636055169.643,
                    "last_seen": 1636055169.643,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.04700016975402832
                  },
                  "mergedEndpoints": [],
                  "method": "delete",
                  "path": "/cart/{email}/{product_id}",
                  "service": "http://trdemo-shoppingcart.trdemo",
                  "serviceEndpointHashes": [
                    "59f52acccd9cd080112a38baecdbf878088d9fee"
                  ],
                  "uuid": "dd74703c-b091-4797-b104-55ef7d1aee7b"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.0016725774037688941,
                    "entries": 111,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054820.513,
                    "hits_rate": 1.085733849600411,
                    "last_active": 1636055172.212,
                    "last_seen": 1636055172.212,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.17099595069885254
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/user/{email}",
                  "service": "http://trdemo-users.trdemo",
                  "serviceEndpointHashes": [
                    "ff532ec47b1ff617fa5c23ed41d91448ca3f5714"
                  ],
                  "uuid": "5ab7ded8-3375-49e1-a13b-cce887b7409a"
                },
                {
                  "ctype": "application/json",
                  "kpis": {
                    "avg_rt": 0.00006846707165868103,
                    "entries": 6,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054820.507,
                    "hits_rate": 0.058688316194616806,
                    "last_active": 1636055171.389,
                    "last_seen": 1636055171.389,
                    "sessions": 2,
                    "sum_duration": 102.23499989509583,
                    "sum_rt": 0.0069997310638427734
                  },
                  "mergedEndpoints": [],
                  "method": "get",
                  "path": "/user/all",
                  "service": "http://trdemo-users.trdemo",
                  "serviceEndpointHashes": [
                    "832377680d185db2eec67ab94c59db519e6f7983"
                  ],
                  "uuid": "914df18f-0392-4d65-b2ba-37edbaa941ab"
                },
                {
                  "ctype": "",
                  "kpis": {
                    "avg_rt": 0,
                    "entries": 7059,
                    "err_rate": 0,
                    "failures": 0,
                    "first_seen": 1636054814.729,
                    "hits_rate": 0.03654511425515473,
                    "last_active": 1636274658.564,
                    "last_seen": 1636274658.564,
                    "sessions": 362,
                    "sum_duration": 193158.51499915123,
                    "sum_rt": 0
                  },
                  "mergedEndpoints": [],
                  "method": "put",
                  "path": "/__amazon_msk_canary",
                  "service": "kafka://kafka",
                  "serviceEndpointHashes": [
                    "23eb14bb59c7e1072f7b79d75b0e360de15d1d56"
                  ],
                  "uuid": "426c38a5-0d90-44c1-8fc7-e389fe8784ca"
                }
              ]
            break;
        case ApiMessageType.WorkspacesList:
            response = ["rb-reg", "test", "workspace-b", "super-long-name-that-doesnt-end"];
            break;
        case ApiMessageType.Swagger:
          response = null;
    }
    return Promise.resolve(response);
}

export const startNewAuth = (env: string) => {
    vsCodeApi.postMessage({
        command: MessageCommandType.StartAuth,
        env
    });
}

export const sendInfoToast = (text: string) => {
  vsCodeApi.postMessage({
    command: MessageCommandType.InfoAlert,
    text
});
}

export const sendErrorToast = (text: string) => {
  vsCodeApi.postMessage({
    command: MessageCommandType.Alert,
    text
});
}

export const setExtensionDefaultWorkspace = (workspaceId: string) => {
  if (isDebug) {
    return;
  }
  vsCodeApi.postMessage({
      command: MessageCommandType.SetDefaultWorkspace,
      workspaceId
  });
}

export const sendPushCodeToEditor = (code: string, header: string) => {
  vsCodeApi.postMessage({
    command: MessageCommandType.PushText,
    code,
    header
  });
};

export const signOut = () => {
  vsCodeApi.postMessage({
    command: MessageCommandType.AuthSignOut
  });
}

//handle messages incoming from the extension
window.addEventListener('message', event => {
    console.log('received message', event.data);
    const message = event.data;
    switch (message.command) {
        case MessageCommandType.AuthError:
            console.log('received authError', message);
            up9AuthStore.setAuthError(message.authError?.message ?? "unknown error occured");
            up9AuthStore.setIsAuthConfigured(false);
            break;
        case MessageCommandType.AuthSuccess:
            console.log('received authResponse', message);
            up9AuthStore.setAuthError(null);
            up9AuthStore.setIsAuthConfigured(true);
            up9AuthStore.setUsername(message.username);
            break;
        case MessageCommandType.ApiResponse:
            console.log('received apiResponse', message);
            const requestMessage = openApiMessages[message.data.apiMessageId];
            if (!requestMessage) {
                console.error("received message from extension with no local message object", message);
            } else {
                if (message.data.error) {
                    requestMessage.onError(message.data.error);
                } else {
                    requestMessage.onComplete(message.data.apiResponse);
                }
            }
            break;
        case MessageCommandType.AuthSignOut:
            console.log('received authSignOut', message);
            up9AuthStore.setAuthError(null);
            up9AuthStore.setIsAuthConfigured(false);
            break;
        case MessageCommandType.StoredData:
            up9AuthStore.setDefaultWorkspace(message.defaultWorkspace);
            up9AuthStore.setUP9Env(message.env);
    }
});
