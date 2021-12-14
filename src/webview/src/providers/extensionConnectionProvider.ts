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
          response = {"http://httpbin2.trdemo":{"info":{"title":"http://httpbin.trdemo - rami schema-test all","version":"0.0.3"},"openapi":"3.1.0","paths":{"/":{"get":{"operationId":"e8913aae-0fe7-404e-928a-03bbe1f15f42","parameters":[],"responses":{"200":{"content":{"text/html":{"example":"<!DOCTYPE html>\n<html lang=\"en\">\n\n<head>\n    <meta charset=\"UTF-8\">\n    <title>httpbin.org</title>\n    <link href=\"https://fonts.googleapis.com/css?family=Open+Sans:400,700|Source+Code+Pro:300,600|Titillium+Web:400,600,700\"\n        rel=\"stylesheet\">\n    <link rel=\"stylesheet\" type=\"text/css\" href=\"/flasgger_static/swagger-ui.css\">\n    <link rel=\"icon\" type=\"image/png\" href=\"/static/favicon.ico\" sizes=\"64x64 32x32 16x16\" />\n    <style>\n        html {\n            box-sizing: border-box;\n            overflow: -moz-scrollbars-vertical;\n            overflow-y: scroll;\n        }\n\n        *,\n        *:before,\n        *:after {\n            box-sizing: inherit;\n        }\n\n        body {\n            margin: 0;\n            background: #fafafa;\n        }\n    </style>\n</head>\n\n<body>\n    <a href=\"https://github.com/requests/httpbin\" class=\"github-corner\" aria-label=\"View source on Github\">\n        <svg width=\"80\" height=\"80\" viewBox=\"0 0 250 250\" style=\"fill:#151513; color:#fff; position: absolute; top: 0; border: 0; right: 0;\"\n            aria-hidden=\"true\">\n            <path d=\"M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z\"></path>\n            <path d=\"M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2\"\n                fill=\"currentColor\" style=\"transform-origin: 130px 106px;\" class=\"octo-arm\"></path>\n            <path d=\"M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z\"\n                fill=\"currentColor\" class=\"octo-body\"></path>\n        </svg>\n    </a>\n    <svg xmlns=\"http://www.w3.org/2000/svg\" xmlns:xlink=\"http://www.w3.org/1999/xlink\" style=\"position:absolute;width:0;height:0\">\n        <defs>\n            <symbol viewBox=\"0 0 20 20\" id=\"unlocked\">\n                <path d=\"M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V6h2v-.801C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8z\"></path>\n            </symbol>\n\n            <symbol viewBox=\"0 0 20 20\" id=\"locked\">\n                <path d=\"M15.8 8H14V5.6C14 2.703 12.665 1 10 1 7.334 1 6 2.703 6 5.6V8H4c-.553 0-1 .646-1 1.199V17c0 .549.428 1.139.951 1.307l1.197.387C5.672 18.861 6.55 19 7.1 19h5.8c.549 0 1.428-.139 1.951-.307l1.196-.387c.524-.167.953-.757.953-1.306V9.199C17 8.646 16.352 8 15.8 8zM12 8H8V5.199C8 3.754 8.797 3 10 3c1.203 0 2 .754 2 2.199V8z\"\n                />\n            </symbol>\n\n            <symbol viewBox=\"0 0 20 20\" id=\"close\">\n                <path d=\"M14.348 14.849c-.469.469-1.229.469-1.697 0L10 11.819l-2.651 3.029c-.469.469-1.229.469-1.697 0-.469-.469-.469-1.229 0-1.697l2.758-3.15-2.759-3.152c-.469-.469-.469-1.228 0-1.697.469-.469 1.228-.469 1.697 0L10 8.183l2.651-3.031c.469-.469 1.228-.469 1.697 0 .469.469.469 1.229 0 1.697l-2.758 3.152 2.758 3.15c.469.469.469 1.229 0 1.698z\"\n                />\n            </symbol>\n\n            <symbol viewBox=\"0 0 20 20\" id=\"large-arrow\">\n                <path d=\"M13.25 10L6.109 2.58c-.268-.27-.268-.707 0-.979.268-.27.701-.27.969 0l7.83 7.908c.268.271.268.709 0 .979l-7.83 7.908c-.268.271-.701.27-.969 0-.268-.269-.268-.707 0-.979L13.25 10z\"\n                />\n            </symbol>\n\n            <symbol viewBox=\"0 0 20 20\" id=\"large-arrow-down\">\n                <path d=\"M17.418 6.109c.272-.268.709-.268.979 0s.271.701 0 .969l-7.908 7.83c-.27.268-.707.268-.979 0l-7.908-7.83c-.27-.268-.27-.701 0-.969.271-.268.709-.268.979 0L10 13.25l7.418-7.141z\"\n                />\n            </symbol>\n\n\n            <symbol viewBox=\"0 0 24 24\" id=\"jump-to\">\n                <path d=\"M19 7v4H5.83l3.58-3.59L8 6l-6 6 6 6 1.41-1.41L5.83 13H21V7z\" />\n            </symbol>\n\n            <symbol viewBox=\"0 0 24 24\" id=\"expand\">\n                <path d=\"M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z\" />\n            </symbol>\n\n        </defs>\n    </svg>\n\n\n    <div id=\"swagger-ui\">\n        <div data-reactroot=\"\" class=\"swagger-ui\">\n            <div>\n                <div class=\"information-container wrapper\">\n                    <section class=\"block col-12\">\n                        <div class=\"info\">\n                            <hgroup class=\"main\">\n                                <h2 class=\"title\">httpbin.org\n                                    <small>\n                                        <pre class=\"version\">0.9.2</pre>\n                                    </small>\n                                </h2>\n                                <pre class=\"base-url\">[ Base URL: httpbin.org/ ]</pre>\n                            </hgroup>\n                            <div class=\"description\">\n                                <div class=\"markdown\">\n                                    <p>A simple HTTP Request &amp; Response Service.\n                                        <br>\n                                        <br>\n                                        <b>Run locally: </b>\n                                        <code>$ docker run -p 80:80 kennethreitz/httpbin</code>\n                                    </p>\n                                </div>\n                            </div>\n                            <div>\n                                <div>\n                                    <a href=\"https://kennethreitz.org\" target=\"_blank\">the developer - Website</a>\n                                </div>\n                                <a href=\"mailto:me@kennethreitz.org\">Send email to the developer</a>\n                            </div>\n                        </div>\n                        <!-- ADDS THE LOADER SPINNER -->\n                        <div class=\"loading-container\">\n                            <div class=\"loading\"></div>\n                        </div>\n\n                    </section>\n                </div>\n            </div>\n        </div>\n    </div>\n\n\n    <div class='swagger-ui'>\n        <div class=\"wrapper\">\n            <section class=\"clear\">\n                <span style=\"float: right;\">\n                    [Powered by\n                    <a target=\"_blank\" href=\"https://github.com/rochacbruno/flasgger\">Flasgger</a>]\n                    <br>\n                </span>\n            </section>\n        </div>\n    </div>\n\n\n\n    <script src=\"/flasgger_static/swagger-ui-bundle.js\"> </script>\n    <script src=\"/flasgger_static/swagger-ui-standalone-preset.js\"> </script>\n    <script src='/flasgger_static/lib/jquery.min.js' type='text/javascript'></script>\n    <script>\n\n        window.onload = function () {\n            \n\n            fetch(\"/spec.json\")\n                .then(function (response) {\n                    response.json()\n                        .then(function (json) {\n                            var current_protocol = window.location.protocol.slice(0, -1);\n                            if (json.schemes[0] != current_protocol) {\n                                // Switches scheme to the current in use\n                                var other_protocol = json.schemes[0];\n                                json.schemes[0] = current_protocol;\n                                json.schemes[1] = other_protocol;\n\n                            }\n                            json.host = window.location.host;  // sets the current host\n\n                            const ui = SwaggerUIBundle({\n                                spec: json,\n                                validatorUrl: null,\n                                dom_id: '#swagger-ui',\n                                deepLinking: true,\n                                jsonEditor: true,\n                                docExpansion: \"none\",\n                                apisSorter: \"alpha\",\n                                //operationsSorter: \"alpha\",\n                                presets: [\n                                    SwaggerUIBundle.presets.apis,\n                                    // yay ES6 modules \u2198\n                                    Array.isArray(SwaggerUIStandalonePreset) ? SwaggerUIStandalonePreset : SwaggerUIStandalonePreset.default\n                                ],\n                                plugins: [\n                                    SwaggerUIBundle.plugins.DownloadUrl\n                                ],\n            \n            // layout: \"StandaloneLayout\"  // uncomment to enable the green top header\n        })\n\n        window.ui = ui\n\n        // uncomment to rename the top brand if layout is enabled\n        // $(\".topbar-wrapper .link span\").replaceWith(\"<span>httpbin</span>\");\n        })\n    })\n}\n    </script>  <div class='swagger-ui'>\n    <div class=\"wrapper\">\n        <section class=\"block col-12 block-desktop col-12-desktop\">\n            <div>\n\n                <h2>Other Utilities</h2>\n\n                <ul>\n                    <li>\n                        <a href=\"/forms/post\">HTML form</a> that posts to /post /forms/post</li>\n                </ul>\n\n                <br />\n                <br />\n            </div>\n        </section>\n    </div>\n</div>\n</body>\n\n</html>"}},"description":"OK"}},"summary":"Seen 1 requests","x-endpoints":["e8913aae-0fe7-404e-928a-03bbe1f15f42"],"x-kpis":{"avg_rt":1.0,"entries":1,"err_rate":0.0,"failures":0,"first_seen":1638437398.302,"hits_rate":35.71413731150109,"last_active":1638437398.3300002,"last_seen":1638437398.3300002,"sessions":1,"sum_duration":0.0280001163482666,"sum_rt":0.0280001163482666}},"parameters":[]},"/anything":{"parameters":[],"post":{"operationId":"b6c1f298-489d-4283-a8bc-c313bb0c5cb9","parameters":[{"examples":["b2ecf022-b748-4889-a7c0-fa926e0e2576","71f4a365-8a51-45e8-8540-a8118a31ef13","ee94009c-16ce-4e83-92d0-ef25a5d33597","1755af01-6085-42b9-a65e-f410876299e9","58ffbfc2-2d96-4ccd-ae74-0311a7a5c73f"],"in":"header","name":"postman-token","required":false,"schema":{"type":"string"}}],"requestBody":{"content":{"application/json":{"schema":{"properties":{"password":{"type":"string"},"token":{"type":"string"},"username":{"type":"string"}},"type":"object"}}},"required":true},"responses":{"200":{"content":{"application/json":{"example":{"args":{},"data":"{\n    \"token\": \"0e2bd42e-eacb-4051-8dfb-ed8fa2d15b9a\"\n}","files":{},"form":{},"headers":{"Accept":"*/*","Accept-Encoding":"gzip, deflate, br","Cache-Control":"no-cache","Connection":"keep-alive","Content-Length":"55","Content-Type":"application/json","Host":"34.140.55.41","Postman-Token":"c2083746-6970-4229-99de-892a891a604f","User-Agent":"PostmanRuntime/7.28.4"},"json":{"token":"0e2bd42e-eacb-4051-8dfb-ed8fa2d15b9a"},"method":"POST","origin":"10.132.0.14","url":"http://34.140.55.41/anything"},"schema":{"properties":{"args":{"type":"object"},"data":{"type":"string"},"files":{"type":"object"},"form":{"type":"object"},"headers":{"properties":{"Accept":{"type":"string"},"Accept-Encoding":{"type":"string"},"Cache-Control":{"type":"string"},"Connection":{"type":"string"},"Content-Length":{"type":"string"},"Content-Type":{"type":"string"},"Host":{"type":"string"},"Postman-Token":{"type":"string"},"User-Agent":{"type":"string"}},"required":["Accept","Accept-Encoding","Cache-Control","Connection","Content-Length","Content-Type","Host","Postman-Token","User-Agent"],"type":"object"},"json":{"properties":{"password":{"type":"string"},"token":{"type":"string"},"username":{"type":"string"}},"type":"object"},"method":{"type":"string"},"origin":{"type":"string"},"url":{"type":"string"}},"required":["args","data","files","form","headers","json","method","origin","url"],"type":"object"}}},"description":"OK"}},"summary":"Seen 56 requests","x-endpoints":["b6c1f298-489d-4283-a8bc-c313bb0c5cb9"],"x-kpis":{"avg_rt":0.002233250678250769,"entries":56,"err_rate":0.0,"failures":0,"first_seen":1638431928.639,"hits_rate":0.7719665842863462,"last_active":1638432001.95,"last_seen":1638432001.95,"sessions":2,"sum_duration":72.54200005531311,"sum_rt":0.1620044708251953}}}},"tags":[],"x-ignoredTarget":false}};
    }
    return Promise.resolve(response);
}

export const startNewAuth = () => {
    vsCodeApi.postMessage({
        command: MessageCommandType.StartAuth,
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
            console.log('received storedData', message);
            up9AuthStore.setDefaultWorkspace(message.defaultWorkspace);
    }
});
