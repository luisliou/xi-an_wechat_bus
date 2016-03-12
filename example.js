express = require('express');
weixin = require('weixin-api');
var app = express();
var bodyParser = require('body-parser');

function send_msg2ifttt(value1, value2, onData){
	var options = {
      host: 'maker.ifttt.com',
      port: 80,
      path: '/trigger/bang/with/key/dqZ-CrBlI8MYwdNejmuYD6',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
	};

	var retMsg = '';
	var req = http.request(options, function(res) {
			//console.log("data: ", post_data);

			res.on("data", function(d) {
				//process.stdout.write(d + '\n');
				retMsg += d;
				console.log('reveived:'+d);
				})
				.on("end", function() {
				console.log('all reveived:'+retMsg);
				onData(retMsg);
				});
			});

	var data_json={'value1':value1, 'value2':value2};
	req.write(JSON.stringify(data_json));
	req.end();
};



// 解析器
app.use(bodyParser.urlencoded({extended: false }))
app.use(bodyParser.json())

// config
weixin.token = 'wechat';

// 接入验证
app.get('/', function(req, res) {

    // 签名成功
    if (weixin.checkSignature(req)) {
        res.send(200, req.query.echostr);
    } else {
        res.send(200, 'fail');
    }
});

var userPdp = new Array();

function findMsg(name, createTime){
    for(var item in userPdp){
	if(userPdp[item].fromUserName == name && userPdp[item].createTime == createTime){
            console.log('found ' + item);
            return 1;
        }
    }
    return 0;
};

function removeFromPdp(name, createTime){
    console.log('to removing ' + name + ' time:' + createTime);
    for(var item in userPdp){
	if(userPdp[item].fromUserName == name && userPdp[item].createTime == createTime){
            userPdp.pop(item);
            //userPdp[item] = undefined;
            console.log('removing ' + item);
            return;
        }
    }
};

// 监听文本消息
weixin.textMsg(function(msg) {
    console.log("textMsg received");
    console.log(JSON.stringify(msg));

    var resMsg = {};

    if(findMsg(msg.fromUserName, msg.createTime)) {
        console.log("----------Wow, retrans found!-----");
        return;
    }
    var item = { 
        fromUserName : msg.fromUserName,
        createTime : msg.createTime
    };
    userPdp.push(item);
    console.log('pushing:' + item.fromUserName + '   time->' + msg.createTime);
    gobus(msg, function ondata(str){
            resMsg = {
                fromUserName : msg.toUserName,
                toUserName : msg.fromUserName,
                msgType : "text",
                content : str,
                funcFlag : 0
            };
        if(findMsg(msg.fromUserName, msg.createTime) == 0) return;
        removeFromPdp(msg.fromUserName, msg.createTime);
        console.log("About Sent!!!!");
        weixin.sendMsg(resMsg, msg.createTime);
    });
});

// 监听图片消息
weixin.imageMsg(function(msg) {
    console.log("imageMsg received");
    console.log(JSON.stringify(msg));
});

// 监听位置消息
weixin.locationMsg(function(msg) {
    console.log("locationMsg received");
    console.log(JSON.stringify(msg));
});

// 监听链接消息
weixin.urlMsg(function(msg) {
    console.log("urlMsg received");
    console.log(JSON.stringify(msg));
});

// 监听事件消息
weixin.eventMsg(function(msg) {
    console.log("eventMsg received");
    console.log(JSON.stringify(msg));
});

// Start
app.post('/', function(req, res) {

    // loop
    weixin.loop(req, res);

});

app.listen(80);

var http = require("http");
var url = require("url");

function getData(url, callback){
	http.get(url, function(res){
			res.setEncoding("utf-8");
			var resData ='';
			res.on("data", function(chunk){
				resData += chunk;
				})
			.on("end", function(){
				var jsData = JSON.parse(resData);
				//console.log(resData);
				callback(jsData);
				});

			});
};


var strLineSrtEndUrl = "http://113.140.71.252:9091/xa_gj_mobile_provide/getBusLineStartAndEndStationAndTime.action?lineName=";
var strQueryAllUrl = "http://113.140.71.252:9091/xa_gj_mobile_provide/queryAllRoute.action";
var strFindRouteUrl = "http://113.140.71.252:9091/xa_gj_mobile_provide/getBusStartEndStationByRouteName.action?routeName=";
var strGetStationByidUrl = "http://113.140.71.252:9091/xa_gj_mobile_provide/getStationByRouteId.action?routeId=";
var strGetRunningBusUrl = "http://113.140.71.252:9091/xa_gj_mobile_provide/getRunningBusInfoByRouteId.action?routeId=";


function text(outStr, str){
	outStr += str;
	outStr += '\n';
};

function output(){
	console.log(outStr);
	outStr = '';
};

var totalAction = [];

totalAction.push('m', function(val, msg, onData){
	console.log('msg::'+msg.createTime);
	send_msg2ifttt(msg.fromUserName, val, function onData(res){
		resMsg = {
                	fromUserName : msg.toUserName,
	                toUserName : msg.fromUserName,
	                msgType : "text",
       		         content : '',
       		         funcFlag : 0
       	        };

		if(res.toString().match('Congratulations') != undefined)
		{
			resMsg.content = '提交成功,别忘了留下名字,如果你想让我知道的话'
		}
		else
		{
			resMsg.content = '竟然发失败了,麻烦直接告诉我吧!'
		}
		weixin.sendMsg(resMsg, msg.createTime);
	});
	//weixin.sendEmptyMsg(msg);
});
totalAction.push('n', function(val, msg, onData){
		getData(strFindRouteUrl+val, function(data){
			var allStr = '';
			//text(allStr, 'Found '+data.totalCount+' line(s)');
			for(var i=0;i < data.totalCount;i++)
			{
			allStr += '[L'+data.data[i].routeId+'] ' + data.data[i].routeName + ' : ' + data.data[i].startEndStation + '\n';
			}
			//console.log(data);
			onData(data.message+'\n'+allStr+'\n输入括号中的内容, 查询相应的线路');
			});
		});

totalAction.push('l', function(val, msg, onData){
		getData(strGetStationByidUrl+val, function(data){
			getData(strGetRunningBusUrl+val, function(runData){
				var allStr = '';
				if(data.data[0] == undefined)
				{
					allStr = '输入有误,请重新输入!';
					onData(allStr);
				}
				else
				{
				var curData = data.data[0].downData;
				for(var i = 0;i < curData.length;i++) {
				var busNum = 0;
				//console.log(data.data[0].downData[i]);
				for(var j = 0;j < runData.data.length;j++) {
				if(curData[i].stationId == runData.data[j].lastStationId)
				{
				busNum++;
				}
				}
				allStr += curData[i].stationName+'('+busNum+')\n';
				}
				allStr += '------------------\n';
				curData = data.data[0].upData;
				for(var i = 0;i < curData.length;i++)
				{
				var busNum = 0;
				for(var j = 0;j < runData.data.length;j++)
				{
					if(curData[i].stationId == runData.data[j].lastStationId)
					{
						busNum++;
					};
				}
				allStr +=curData[i].stationName+'('+busNum+')\n';
				};
				allStr += '\n**括号内的数字表示已到达本站的车辆数**';
				onData(data.message+'\n'+allStr);
				}
			});
		});
});

function help(val, onData){
    onData('输入N+线路名称, 查询线路编号\n输入L+线路编号,查询线路信息\n输入M+你想说的建议,我会看到的');
};


function gobus(msg, onData){
	var str = msg.content;
	console.log('Your input:' + str);
	for(var i = 0;i < totalAction.length;i += 2){
		var key = str.toLowerCase().match(totalAction[i]);
		if(key != undefined){
			var value = str.substring(key.index + totalAction[i].length);
			if(value[0] == ' '
					|| value[0] == ':'
					|| value[0] == '+'
			  ){
				value = value.substring(1);
			}
			totalAction[i + 1](value, msg, onData);
                        return;
		}
	};
	if(i == totalAction.length){
            help(value, onData);
    }
};
