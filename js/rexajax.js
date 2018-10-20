// JavaScript Document utf-8
// 基于jquery框架的relax ajax类
// author: relaxWang
// time: 2018-10-16
//[修改] 2014-7-14 考虑jsonp跨域调用的情况下的响应
//[修改] 2015-11-5 初始化参数传递的时候使用setObject，该参数接受对象值，对象元素的名称与属性名称对应，从而避免new之后在一个一个属性赋值
//[优化] 2016-01-28 按需求增加供before方法调用的函数（类），用于展现AJAX加载时的提示，考虑背景屏蔽层的展现不展现，考虑是否可以强制取消当前通信的ajax等，实际并不属于AJAX类的一部分，而一般供AJAX类调用，联系紧密则安排在这里
//[修改] 2016-08-02 如果JSONP是多次的异步请求，之前的jsonpcallback函数由于使用同一个函数名，会导致覆盖的问题，所以这里修改成jquery自己的处理方式，请确保在服务端使用get来获取callback参数进行整合返回
//[修改] 2016-10-24 对于timeout事件，光是在客户端执行了超时操作，其实http传输的数据依然在进行，现修改为一旦超时，将会主动取消数据传输，避免客户端超时提示后服务端其实还能正常接收数据并完成通信
//[修改] 2016-12-05 在before事件中增加ajax请求时候的header部分自定义参数 request_type，对应值为ajax 请于服务端获取请求头部进行请求类型判断 PHP exp: if ($_SERVER['HTTP_REQUEST_TYPE']=='ajax') ...
//                  对于非本类加工的ajax请求，请服务端使用 PHP exp: $_SERVER['HTTP_X_REQUESTED_WITH']进行判定 通常jquery的AJAX请求都会带X-Requested-Width头部值
//[修改] 2017/4/13 针对当前业务单点登录，对于success事件做了调整，通用化中可以不使用该调整
//[修改] 2017/5/12 对错误提示的555状态进行进一步完善
//[测试并修改] 2017/12/13 在原先公司时对beforeSend事件增加了自定义的header头信息，导致跨域返回后出错，进行了测试，并初步了解了Access-Control-Allow-Headers的配置相关，这里去掉原先的自定义头部，后期再考虑添加这样的功能并开放配置方法
//[修改] 2018-1-3 对于跨域调用使用了xhrFields:{withCredentials:true} 使得跨域的cookie可以在ajax中进行传递，并增加全局rexBug的验证，用于标记调试指令，并在调试的时候启用withCredentials为true
/*
以下记录 2016/10/25
无错误情况的执行特性
先触发before事件，在触发success事件，最后触发complete事件
	XHR.readyState:4
	XHR.status:200
	XHR.responseText:正常返回的信息
	XHR.statusText:"OK"
	status:success
	errorThrown:--

URL页面404错误
	触发error事件
	XHR.readyState:4
	XHR.status:404
	XHR.responseText:404描述的html文档
	XHR.statusText:"Not Found"
	status:error
	errorThrown:"Not Found"

服务端执行错误
	如果是dataType="html"/"text"的情况下
		触发success事件
		XHR.readyState:4
		XHR.status:200
		XHR.responseText:服务端的出错信息文本
		XHR.statusText:"OK"
		status:success
		errorThrown:--
	如果是dataType="json"的情况下
		触发error事件
		XHR.readyState:4
		XHR.status:200
		XHR.responseText:服务端的出错信息文本
		XHR.statusText:"OK"
		status:parsererror
		errorThrown:SyntaxError:Unexpected token < in JSON at position 0 [json解析错误]

域名解析错误
	触发error事件
	XHR.readyState:0
	XHR.status:0
	XHR.responseText:""
	XHR.statusText:"error"
	status:error
	errorThrown:""

超时
	触发error事件
	XHR.readyState:0
	XHR.status:0
	XHR.responseText:  无此项
	XHR.statusText:"timeout"
	status:timeout
	errorThrown:timeout

302重定向
	AJAX端无法检测重定向的302状态码和对应文本，该定向会在浏览器底层执行，不会通知JS。

数据解析错误
	如果请求的是json数据，而返回数据非json，则会执行error事件，并报解析错误
	如果请求的是html或者text数据，即使返回的是json数据，也不会报错，而是会把返回值当作字符串处理

客户端主动取消
	触发error事件
	XHR.readyState:0
	XHR.status:0
	XHR.responseText:  无此项
	XHR.statusText:"abort"
	status:abort
	errorThrown:abort

综上
	1.服务端执行错误和AJAX成功调用在请求数据类型是html/text的情况下通过以上数据是无法区分出来，所以需要跟服务端约定出错返回信息，同样服务端也要对服务端错误进行捕获处理，而非原生抛错
	2.404错误仅需在错误事件中判定 XHR.status=404即可
	3.超时判定可以通过在错误事件中判定 XHR.statusText="timeout"即可
	4.域名解析错误的状态虽然在记录中不同于其他状态，不过直觉不能轻易从该关键属性值的特性说明是域名解析错误，不过至少和服务端错误的区分在于服务端错误的XHR.statusText="OK"，而解析错误的 XHR.statusText="error"
	5.客户端主动取消ajax，可以从XHR.statusText="abort"简单判定
	6.在通信请求的数据类型是json的情况下，服务端错误与服务端正常返回的数据非json类型两种情况都会触发json的解析错误，无法分辨，所以按1要求，服务端同样要对错误信息进行捕捉加工后返回

2017/12/13 测试了下服务端配置跨域允许
请在服务端返回页中增加以下语句或者配置于http服务程序中
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authority, Request_type");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE");
特别注意下后两个配置,headers应对请求中的headers 如果请求中包含这里没有配置的header，则ajax会捕获error事件 比如后面两个Authority,Request_type为自定义头，如果在服务端没有进行配置，则会报错，Methods本以为特性也和header一样，把服务端配置的method的配置仅留下GET，ajax的传输用POST，测试时却发现并未导致错误
2018/10/16 对于success的业务逻辑报错，目前提供
*/
// 使用方法
// 	step1 申明一个relaxAJAX对象  exp:  var obj = new relaxAJAX()
//  step2 准备各种参数 必要的是 url exp:  obj.url = "test.php"
//  step3 可以为其相关的事件定义函数 比如调用成功后的回调函数 或者失败的回调函数 等 需要注意的是参数协调 例如 obj.success = function(data){....} 其data就是为了接收调用成功后获得的返回数据（如果有返回的话） obj.error = function(status, errMsg)  status为错误类型 errMsg错误提示
//  step4 最后使用send方法来发起ajax请求 exp: obj.send();
//  step5 可用方法abort来取消正在进行中的ajax请求 当前版本的jquery abort最后会在error事件中触发 且触发的status为abort
function relaxAJAX(setObject){
	this.dataType = "json";
	this.type = "POST";
	this.url ="";
	this.data = "";
	this.timeout = 50 * 1000;
	this.before = "";
	this.success = "";
	this.error = "";
	this.complete = "";
	this.cache=true;
	this.withCredentials=!!window.rexBug;
	this.succChecker='';

	//------ 以下一般不做设置，仅做读取 --------------------------
	this.message = "没有AJAX申请";
	this.flag = 0;    //flag编号按HTTP协议首部状态编号来释义
	this.ajax = "";

	if (setObject){
		for(var x in this){
			if (setObject[x]){ this[x] = setObject[x]; }
		}
	}

	this.withCredentials=this.withCredentials? {withCredentials:true}:"";
}

//发送ajax请求
relaxAJAX.prototype.send = function(){
	var CL = this;
	var urlString = arguments[0];
	if (urlString){ CL.url = urlString; }
	if (CL.url === ""){
		CL.flag = 400;
		CL.message = "提交的访问路径为空";
		return false;
	}
	//判断是否在发送中
	if (CL.flag === 100){ return false; }
	CL.ajax = $.ajax({
		dataType: CL.dataType,
		type: CL.type,
		url: CL.url,
		data: CL.data,
		timeout: CL.timeout,
		cache: CL.cache,
		//contentType:"application/json; charset=UTF-8",
    xhrFields:this.withCredentials,
		success: function(data, status, XHR){
			//modify by relax 2017/4/13 临时应对业务层的AJAX遇到单点登录超时，进行跳转
			/*
			if (typeof(data)=="object" && data.succ==false && data.code=="SYS_WEB_NEED_REDIRECT"){
				top.location.href=data.result;
				//console.log("单点登录超时，重新登录");
				return false;
			}
			*/
			//modify by relax 2018/10/16 应对业务层错误和错误处理统一化
      //succChecker为调用者自定义，ajax通信成功后类会先调用这个方法来验证，验证返回一个对象，结构{flag:[true/flase],code:错误代号,msg:错误描述}
			if (CL.succChecker && typeof(CL.before) === "function"){
			  var returnObj=CL.succChecker(data);
			  if (!returnObj.flag){
			    CL.flag = 400;
          CL.doError(returnObj.code, returnObj.msg);
          return;
        }
      }
			CL.flag = 200;
			CL.message = "ok";
			if (typeof(CL.success) === "function"){ CL.success(data); }
		},
		beforeSend: function(xhr){
			//xhr.setRequestHeader("request_type", "ajax"); //添加自定义请求头
			//xhr.setRequestHeader("Authority", true);
			CL.flag = 100;
			CL.message = "requesting...";
			if (typeof(CL.before) === "function"){ CL.before(); }
		},
		complete: function(XHR, status){
			if (typeof(CL.complete) === "function"){ CL.complete(); }
		},
		error: function(XHR, status, errorThrown){
			if (XHR.statusText==="abort"){
				CL.flag=420;
				CL.message="客户端已取消数据交互操作。";
				CL.doError("abort", CL.message);
			}else{
				if (XHR.status===404){
					CL.flag=404;
					CL.message="请求的资源不存在。";
					CL.doError("404", CL.message);
				}else{
					if (XHR.statusText==="timeout"){
						CL.flag=408;
						CL.message="请求超时，请检查网络连接后再重试。";
						CL.doError("timeout", CL.message);
					}else{
						if (CL.dataType==="json" && XHR.readyState===4 && XHR.status===200 && XHR.statusText==="OK"){
							CL.flag=500;
							if (XHR.responseText.substr(0,1)!=="{"){
								CL.message="服务端错误。";
								CL.doError("500", CL.message+" "+XHR.responseText);
							}else{
								CL.message="json数据解析错误。";
								CL.doError("500", CL.message+" "+XHR.responseText);
							}
						}else{
							CL.flag=555;
							if (errorThrown===""){
								errorThrown="可能是由于网络中断导致的，请检查本地网络连接。"
							}
							CL.message="未知错误，";
							CL.doError("555", CL.message+errorThrown);
						}
					}
				}
			}
		}
	});
};

//取消ajax请求方法 如果已经取消再调用此方法则不会有任何效果
relaxAJAX.prototype.abort=function(){
	var CL=this;
	if (typeof(CL.ajax)=="string"){ return false; }
	CL.ajax.abort();
	CL.ajax="";
};
//错误处理的通用方法
relaxAJAX.prototype.doError=function(status, errorThrown){
	var CL=this;
	if (typeof(CL.error)=="function"){ CL.error(status, errorThrown) };
};
