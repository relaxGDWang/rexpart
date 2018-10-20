//--------------------------- 通用JS函数 coding UTF-8------------------------------------
//relax 公共函数库 v1.1.1
//last modify by relax 2018/4/7
//4/7 在setCookie函数中，默认增加了path=/的cookie范围，发现IE及edge浏览器对于跨域或者iframe嵌套跨域的cookie在使用上如果不设置会导致访问cookie的目录同设置cookie目录不同则访问不能

;(function(){
  //清除字符串左右空格函数  jquery
  String.prototype.Trim=function(e){
    return this.replace(/(^\s*)|(\s*$)/g,"");
  };

  //[IE8] 数组的indexOf方法协调
	if (!("indexOf" in Array.prototype)){
		Array.prototype.indexOf = function(words){
			for (var i=0,j; j=this[i]; i++){
				if (j===words){return i;}
			}
			return -1;
		}
	}

	//[IE8] JSON对象的encode和decode方法的兼容
	if (!window.JSON) {
    window.JSON = {
      parse: function (jsonStr) {
        if (typeof(jsonStr) !== "string") {
          return jsonStr;
        } else {
          jsonStr = decodeURIComponent(jsonStr);
          return eval('(' + jsonStr + ')');
        }
      },
      stringify: "",
      stringify2: ""
    };
  }
  window.JSON.stringify2=function(json){
    if (json===undefined || json===null) return "";
    if (typeof(json)!=="object") return json;
    var returnStr="";
    for (var x in json){
      if (typeof(json[x])==="function") continue;

      returnStr+=",";
      if (typeof(json[x])!=="object"){
        returnStr += "\""+ x +"\":";
        if (typeof(json[x])==="number" || typeof(json[x])==="boolean"){
          returnStr += JSON.stringify2(json[x]);
        }else{
          returnStr += "\""+ JSON.stringify2(json[x]) +"\"";
        }
      }else{
        //判定是否是数组
        var returnTemp,returnType;
        if (json[x]!==null && json[x].constructor===Array){
          returnStr += "\""+ x +"\":[";
          var arrayStr = "";
          for (var ii=0,len=json[x].length; ii<len; ii++){
            returnTemp=JSON.stringify2(json[x][ii]);
            returnType=typeof(returnTemp);
            if (returnTemp!=="" && (typeof(json[x][ii])==="object" || returnType==="number" || returnType==="boolean")){
              arrayStr += ","+returnTemp;
            }else{
              arrayStr += ",\""+returnTemp+"\"";
            }
          }
          if (arrayStr!=="") arrayStr=arrayStr.substr(1);
          returnStr += arrayStr+"]";
        }else{
          returnStr += "\""+ x +"\":";
          returnTemp=JSON.stringify2(json[x]);
          returnType=typeof(returnTemp);
          if (returnTemp!=="" && (typeof(json[x])==="object" || returnType==="number" || returnType==="boolean")){
            returnStr += returnTemp;
          }else{
            returnStr += "\""+ returnTemp +"\"";
          }
        }
      }
    }
    //去掉起始的,符号
    if (returnStr.length > 1) returnStr = returnStr.substr(1);
    returnStr = "{" + returnStr + "}";
    return returnStr;
  };
	//自定义JSON对象解析的协调 即IE8的stringify与stringify2其实是同一个函数
  if (window.JSON.stringify==="")  window.JSON.stringify=window.JSON.stringify2;

  //JSON对象方法的扩展
  //把并列级别的json按数据关系扩展成一维的树索引结构
  //先决条件 必须保证元素中的唯一编码在整个集合中都是唯一的
  //仅存放结构，其他的数据项请通过索引在原数据中找
  /*
  data={
    keyCode:{
      key:
      index:
      parent:key,
      children:[key1,key2,key3.....]
    },
    .....
  }
  config结构配置参数，应该如
  [{
    key:"数据中主键名",
    data:数据对象,
    rel:父对象关系的字段名
  },
  ...]
  */
  window.JSON.directory=function(config){
    var returnObj={};
    if (config instanceof Array){
      for (var i=0; i<config.length; i++){
        var temp,key,parent;
        for (var x in config[i].data){
          temp=config[i].data[x];
          key=config[i]["key"];
          if (!temp || !key) return {};
          returnObj[temp[key]]={
            parent:"",
            children:[]
          };

          if (config[i]["rel"]){
          	var tempArray = config[i]["rel"].split(".");
          	parent = temp[tempArray[0]];
          	for (var j = 1; j < tempArray.length; j++) {
          		parent = parent[tempArray[j]];
            }
            returnObj[temp[key]].parent=parent;
            returnObj[parent]["children"].push(temp[key]);
          }
        }
      }
    }
    return returnObj;
  };

  //把数组结构的json数据转换为json索引结构
  window.JSON.array2Object=function(arrayObj,key){
    if (key && arrayObj instanceof Array){
      var returnObj={};
      var keyWords;
      for (var i=0,len=arrayObj.length; i<len; i++){
        keyWords=arrayObj[i][key];
        returnObj[keyWords]={};
        for (var x in arrayObj[i]){
          returnObj[keyWords][x]=arrayObj[i][x];
        }
      }
      //returnObj.length=arrayObj.length;
      return returnObj;
    }else{
      return arrayObj;
    }
  };

	//正则对象扩展方法
	//包含简单逻辑的检查方法
	/*
	使用要点
	1.使用该方法可以简易匹配中文字符，仅需在正则中包含“中文”字符即可
	2.涉及简单的逻辑与，可以使用 空格*空格把两个（多个）正则表达式衔接 例如 ^\w+$ * ^[中文]{2,3}$ 此时返回true的条件是同时满足这两个正则条件
	3.逻辑或可以用 空格+空格 分割多个正则
	*/
  RegExp.prototype.check=function(str){
    var regStr=this.toString();
    var regObj;
    var bt=0;
    if (regStr.indexOf("中文")>-1) bt=bt|4;
    if (regStr.indexOf(" + ")>-1) bt=bt|2;
    if (regStr.indexOf(" * ")>-1) bt=bt|1;
    if (bt===0){
      regObj=this;
    }else{
      var regFlag=regStr.replace(/\/.*\//,"").toLowerCase();
      var iFlag=regFlag.indexOf("i")>-1? "i":"";
      var gFlag=regFlag.indexOf("g")>-1? "g":"";
      var mFlag=regFlag.indexOf("m")>-1? "m":"";
      var flagStr=iFlag+gFlag+mFlag;
      if ((bt&4)===4) regStr=regStr.replace(/中文/g,"\\u4e00-\\u9fa5");
      regStr=regStr.replace(/(^)\//,"$1").replace(/\/[igm]*($)/,"$1");
      if ((bt&3)>0){
        var flag,regItem,regArray;
        if ((bt&2)===2){
          flag=false;
          regArray=regStr.split(" + ");
          for (var i=0; i<regArray.length; i++){
            regItem=new RegExp(regArray[i],flagStr);
            if (regItem.test(str)){
              flag=true;
              break;
            }
          }
        }else{
          flag=true;
          regArray=regStr.split(" * ");
          for (var i=0; i<regArray.length; i++){
            regItem=new RegExp(regArray[i],flagStr);
            if (!regItem.test(str)){
              flag=false;
              break;
            }
          }
        }
        return flag;
      }else{
        regObj=new RegExp(regStr,flagStr);
      }
    }
    return regObj.test(str);
  };
})();
/* 常用正则表达式 */
var rexReg={
  date: /^\d{4}[\/-](0?[1-9]|1[0-2])[\/-](0?[1-9]|[1-2][0-9]|3[0-1])$/,
  time: /^0?[0-9]|1[0-9]|2[0-3](:[0-5]?[0-9]){2}$/,
  dateTime: /^\d{4}[\/-](0?[1-9]|1[0-2])[\/-](0?[1-9]|[1-2][0-9]|3[0-1])(\s(0?[0-9]|1[0-9]|2[0-3])(:[0-5]?[0-9]){2})?$/
};

//vue not required
//选择复选框组 选择全部记录/取消全部记录
/*
	nameStr 复选/单选对应的name字符串
	valueStr 各个值的逗号分隔字符 如 val1,val2,val3
	fatherObj 查找对象所在的父/祖先Dom对象 默认为body
	返回 设置有一项成功返回true 全部失败返回false
*/
function JS_setCheckValue(nameStr, setValue, fatherObj){
	var Checkers,i;
	if (!fatherObj || typeof(fatherObj)!=="object"){
		Checkers = document.getElementsByTagName("input");
	}else{
		Checkers = fatherObj.getElementsByTagName("input");
	}
	if (Checkers.length===0) return false;
	
	var tempArray = [];
	for (i=0; i<Checkers.length; i++){
		if ((Checkers[i].type==="checkbox" || Checkers[i].type==="radio") && Checkers[i].name===nameStr) tempArray.push(Checkers[i]);
	}
	if (tempArray.length===0) return false;
	var nowType = "checkbox";
	if (tempArray[0].type==="radio") nowType="radio";

  if (setValue===undefined || setValue===null) setValue=false;
	if (setValue===true || setValue===false){
		if (nowType==="radio"){
			if (setValue){
				tempArray[0].checked=true;
			}else{
				for (i=0; i<tempArray.length; i++){
					tempArray[i].checked=false;
				}
			}
		}else{
			for (i=0; i<tempArray.length; i++){
				tempArray[i].checked=setValue;
			}
		}
	}else if (setValue instanceof Array){
		for (i=0; i<tempArray.length; i++){
			tempArray[i].checked=setValue.indexOf(tempArray[i].value)>=0
		}
	}else{
		return false;
	}
	return true;
}

//vue not required
//获得选择框(复选框/单选框)选中单元的值
/*
	nameStr 求值元素的name属性
	fatherObj 需要在哪个DOM元素下执行 如果没有传递则使用document
	返回 获得的值组成的数组
*/
function JS_getCheckValue(nameStr, fatherObj){
	var Checkers;
  if (!fatherObj || typeof(fatherObj)!=="object"){
    Checkers = document.getElementsByTagName("input");
  }else{
    Checkers = fatherObj.getElementsByTagName("input");
  }
  if (Checkers.length===0) return false;
  var returnArray=[];
  for (var i=0;i<Checkers.length;i++){
    if (Checkers[i].name===nameStr && Checkers[i].checked===true) returnArray.push(Checkers[i].value);
  }
  return returnArray;
}


//will repeal
//关闭当前窗口
/*
临时保留 目前测试chrome可以无提示关闭，而firefox则无法关闭，提示告警信息为 只能关闭JS指令打开的窗口 IE11则会有确认窗弹出以让用户确认是否关闭
移动端没有测试
诸多不统一，不建议继续使用，或者进一步测试window.open窗体是否在PC端浏览器都能通过该指令关闭
*/
function JS_WINCLOSE(){
	window.top.opener = '';
	window.top.close();
}

//判定parentNode元素中是否包含childNode元素
//返回true 表示包含 flase表示不包含 空表示parentNode和childNode是同一个DOM元素
function JS_contains(parentNode, childNode){
	//modify by relax 2016/11/4 由于在使用selection和range的情况下会涉及到字符串的问题，所以这里做协调
	if (childNode && childNode.toString().toLowerCase()==="[object text]") childNode=childNode["parentNode"];
	if (parentNode === childNode) return "";
	if (parentNode.contains){
		return  parentNode.contains(childNode);
	}else{
		return !!(parentNode.compareDocumentPosition(childNode) & 16);
	}
}

//按事件来判定是否事件触发元素在需要元素内部  用于mouserover和mouseout
//如果在元素内部则返回false 不在则返回true
function JS_checkHover(e,target){
	if (e.type=="mouseover"){
			return !JS_contains(target,e.relatedTarget || e.fromElement) && !((e.relatedTarget || e.fromElement)===target);
	}else{
			return !JS_contains(target,e.relatedTarget || e.toElement) && !((e.relatedTarget || e.toElement)===target);
	}
}

//will test
//获得子对象到父辈对象的左上角距离
function JQ_getOffset(subObj, parentObj){
	var obj = subObj;
	var offLeft=0;
	var offTop=0;
	var eachobj = [];
	var MAX = 100;
	while(obj && obj!=parentObj && MAX>0){
		eachobj.push(obj);
		obj = $(obj).parent()[0];
		MAX--;
	}
	offLeft = 0;
	offTop = 0;
	if (eachobj.length > 0){
		offLeft += eachobj[0].offsetLeft;
		offTop += eachobj[0].offsetTop;
		for (var i=1; i<eachobj.length; i++){
			offLeft += eachobj[i].offsetLeft + eachobj[i].scrollLeft;
			offTop +=  eachobj[i].offsetTop + eachobj[i].scrollTop;
		}
		offLeft -= parentObj.scrollLeft;
		offTop -= parentObj.scrollTop;
	}
	return {"offsetLeft":offLeft,"offsetTop":offTop};
}

//禁止事件传递
function protectEvent(eventObj){
  //禁止冒泡
  if (eventObj && eventObj.stopPropagation){
    eventObj.stopPropagation();
  }else{
    window.event.cancelBubble = true;
    return false;
  }
  //禁止默认事件
  if (eventObj && eventObj.preventDefault){
    eventObj.preventDefault();
  }else{
    window.event.returnValue = false;
    return false;
  }
}

//保存或者修改cookie
//ckName cookie的索引名
//ckValue cookie的键值
//limitTime cookie的生命时间，单位为秒， 不填写则使用当前周期内的cookie，即页面关闭后cookie也会丢失
//domain 设置cookie对应的域名
function setCookie(ckName,ckValue,limitTime,domain){
  ckValue=encodeURIComponent(ckValue);
  var expTime=new Date();
  var timeStr = "";
  if (parseInt(limitTime) > 0){
    limitTime = parseInt(limitTime);
    expTime.setTime(expTime.getTime() + limitTime * 1000);
    timeStr = "expires=" + expTime.toGMTString() + ";";
  }else{
    timeStr = "";
  }
  if (domain){
    domain="domain="+domain+";";
  }else{
    domain="";
  }
  document.cookie = ckName +"="+ ckValue + ";path=/;" + timeStr + domain;
}

//读取指定的cookie值
function getCookie(ckName){
  var tempStr=document.cookie;
  var tempArray=tempStr.match(new RegExp("(^|\\s|;)"+ckName+"=[^;$\\s]*(;|$|\\s)","ig"));
  if (!tempArray || tempArray.length<=0){
    return undefined;
  }else{
    if (tempArray.length>1){
      return false;
    }else{
      var txt=tempArray[0].Trim();
      txt = txt.replace(/;/ig,"");
      var splitStr=txt.split("=");
      if (splitStr.length!==2){
        return false;
      }else{
        return decodeURIComponent(splitStr[1].Trim());
      }
    }
  }
}

//删除指定的cookie 
function delCookie(ckName,domain){
	var expTime = new Date(); 
	expTime.setTime(expTime.getTime() - 10000);
  if (domain){
    domain="domain="+domain+";";
  }else{
    domain="";
  }
	if (ckName===""){
		//删除全部cookie
		var nowCookie = document.cookie.Trim();
		if (nowCookie === ""){
			return false;
		}else{
			var tempArray = nowCookie.split(";");
			for (var i=0; i<tempArray.length; i++){
				var tempArray2 = tempArray[i].split("=");
				if (tempArray2.length === 2){
          document.cookie = tempArray2[0] +"=; expires=" + expTime.toGMTString() +";"+domain;
        }
			}
			return true;
		}
	}else{
		document.cookie = ckName +"=; expires=" + expTime.toGMTString() +";"+domain;
		return true;
	}
}

//获得某个时间对应的unix时间戳
/*
dtimeStr 日期时间字符串 或者日期对象 默认不填写或者空字符串即获得当前时间的unix时间戳 可以是单独日期，以该日期的0:00:00进行计算
areaNumber 时区 可以设置-12~12之间的整数
返回的是dtimeStr指定时间的unix时间戳整数
*/
function getUnixTime(dtimeStr, areaNumber){
  var dtimeObj;
	if (dtimeStr instanceof Date){
		dtimeObj=dtimeStr;
	}else{
    if (typeof(dtimeStr)==="string" && dtimeStr!=="" && rexReg.dateTime.test(dtimeStr)===false) return -1;
		if (dtimeStr===undefined || dtimeStr===""){
			dtimeObj = new Date();
		}else{
			dtimeStr=dtimeStr.replace(/-/g,"\/");
			dtimeObj = new Date(dtimeStr);
		}
		if (isNaN(dtimeObj)) return -1;
	}
	//计算默认时区
	var zeroUnixTime = dtimeObj.getTime() + dtimeObj.getTimezoneOffset()*60*1000; //获得0时区的标准时间
	var timeAreaCode = dtimeObj.getTimezoneOffset()/60;
	if (areaNumber){
		areaNumber=parseInt(areaNumber);
		if (!isNaN(areaNumber) && areaNumber>=-12 && areaNumber<=12) timeAreaCode=areaNumber;
	}
  return zeroUnixTime - timeAreaCode*60*60*1000;
}

//获得某个unix时间戳对应的实际日期时间字符串
/*
dtimeVal unix时间戳数值，或者日期对象，或者空字符
areaNumber 时区
splitStr 分隔日期的字符串 可以是/或者-
fullFormat true/false 是否用完整形式表示日期时间
*/
function getStringTime(dtimeVal,areaNumber,splitStr,fullFormat){
  var tempDate=new Date();
	if (dtimeVal instanceof Date){
		dtimeVal=dtimeVal.getTime()+tempDate.getTimezoneOffset() * 60 * 1000;
	}else{
    if (!dtimeVal || parseInt(dtimeVal)>0) {
      //时区处理 还原成0区时间
      if (isNaN(dtimeVal - 0)) {
        dtimeVal = tempDate.getTime() + tempDate.getTimezoneOffset() * 60 * 1000;
      } else {
        dtimeVal = (dtimeVal - 0) + tempDate.getTimezoneOffset() * 60 * 1000;
      }
    }else{
    	return "";
		}
	}
	var timeAreaCode=tempDate.getTimezoneOffset()/60;
	if (areaNumber){
		areaNumber=parseInt(areaNumber);
		if (!isNaN(areaNumber) && areaNumber>=-12 && areaNumber<=12) timeAreaCode=areaNumber;
	}
	//按设置时区进行调整
	dtimeVal=dtimeVal-timeAreaCode*60*60*1000;
	tempDate.setTime(dtimeVal);
	splitStr=splitStr==="-"? "-":"/";
	fullFormat=!!fullFormat;
	var temp = {
		year:  tempDate.getFullYear(),
		month: tempDate.getMonth()+1,
		day:   tempDate.getDate(),
		hour:  tempDate.getHours(),
		minute:tempDate.getMinutes(),
		second:tempDate.getSeconds()
	};
	if (fullFormat){
		for (var x in temp){
			if (temp[x] < 10) temp[x] = "0" + temp[x];
		}
	}
	var dateStr = temp.year + splitStr + temp.month + splitStr + temp.day;
	var timeStr = temp.hour + ":" + temp.minute + ":" + temp.second;
	return dateStr + " " + timeStr;
}

//按要求格式化日期时间的字符串，返回对应的字符串
/*
dateObj 需要格式化的日期时间字符串或者Date对象 或者包含y,m,d,h,n,s属性的对象
typeStr 需要返回的类型，date还是time 默认是返回包含日期和时间的字符串
splitStr 日期中的间隔字符串
fullFormat true/false 是否是完整格式
*/
function formatDateTime(dateObj,typeStr,splitStr,fullFormat){
	if (dateObj instanceof Date){
	}else{
		if (dateObj==="" || dateObj===undefined){
			dateObj=new Date();
		}else{
			if (typeof(dateObj)==="object" && ("y" in dateObj)){
				dateObj=new Date(dateObj.y+"/"+dateObj.m+"/"+dateObj.d+" "+dateObj.h+":"+dateObj.n+":"+dateObj.s);
			}else if(typeof(dateObj)==="string" && rexReg.dateTime.test(dateObj)===true){
				var temp=dateObj.split(" ");
				var temp2=temp[0].split(/[\/-]/);
				if (temp.length<2){
					dateObj=new Date(temp2[0]-0,temp2[1]-1,temp2[2]-0);
				}else{
					var temp3=temp[1].split(":");
					dateObj=new Date(temp2[0]-0,temp2[1]-1,temp2[2]-0,temp3[0]-0,temp3[1]-0,temp3[2]-0);
				}
			}else{
				return "";
			}
		}
	}
	var t = {
		y:  dateObj.getFullYear(),
		m:  dateObj.getMonth()+1,
		d:  dateObj.getDate(),
		h:  dateObj.getHours(),
		n:  dateObj.getMinutes(),
		s:  dateObj.getSeconds()
	};
	if (fullFormat){
		for (var x in t){
			if (x==="y") continue;
			t[x] = t[x]>=10? t[x]:"0"+t[x];
		}
	}
	var tempStr = t.y + "年" + t.m + "月" + t.d + "日 " + t.h + ":" + t.n + ":" + t.s;
	if (splitStr!=='c'){
		tempStr=tempStr.replace('日','');
		if (splitStr===undefined || splitStr==='/'){
			tempStr=tempStr.replace(/[^\d\:\s]/g,'/');
		}else if(splitStr==='-'){
			tempStr=tempStr.replace(/[^\d\:\s]/g,'-');
		}
	}
	if (typeStr!=="date" && typeStr!=="time"){
		return tempStr;
	}else{
		if (typeStr==="date") return tempStr.split(" ")[0];
		return tempStr.split(" ")[1];
	}
}

//获得某一日期时间的范围内的上限或者下限
//说明 例如 2015-6-7 12:43:33 按日的上限日期时间为 2015-6-30 23:59:59 一般用在日期查询范围
//dateObj 日期时间对象
//typeStr 参考对象M,D,H,N,S
//op min表示下限 max表示上限
//返回 经过计算过的date对象
function limitDate(dateObj,typeStr,op){
	if (!(dateObj instanceof Date)) return null;
	var t = {
		y:  dateObj.getFullYear(),
		m:  dateObj.getMonth()+1,
		d:  dateObj.getDate(),
		h:  dateObj.getHours(),
		n:  dateObj.getMinutes(),
		s:  dateObj.getSeconds()
	};
	typeStr=typeStr.toUpperCase();
	switch(typeStr){
		case "M":
			if (op==="min"){
				t.m = 1;
				t.d = 1;
				t.h = 0;
				t.n = 0;
				t.s = 0;
			}else{
				t.m = 12;
				t.d = 31;
				t.h = 23;
				t.n = 59;
				t.s = 59;
			}
			break;
		case "D":
			if (op==="min"){
				t.d = 1;
				t.h = 0;
				t.n = 0;
				t.s = 0;
			}else{
				if (t.m===2){
					if (learYear(t.y)===true){
						t.d = 29;
					}else{
						t.d = 28;
					}
				}else{
					if ([1,3,5,7,8,10,12].indexOf(t.m)>=0){
						t.d = 31;
					}else{
						t.d = 30;
					}
				}
				t.h = 23;
				t.n = 59;
				t.s = 59;
			}
			break;
		case "H":
			if (op==="min"){
				t.h = 0;
				t.n = 0;
				t.s = 0;
			}else{
				t.h = 23;
				t.n = 59;
				t.s = 59;
			}
			break;
		case "N":
			if (op==="min"){
				t.n = 0;
				t.s = 0;
			}else{
				t.n = 59;
				t.s = 59;
			}
			break;
		case "S":
			if (op==="min"){
				t.s = 0;
			}else{
				t.s = 59;
			}
			break;
	}
	dateObj = new Date(t.y+"/"+t.m+"/"+t.d+" "+t.h+":"+t.n+":"+t.s);
	return dateObj;
}

//日期时间的偏移处理函数 按所需要的位进行偏移计算
//说明 例如 2016-4-5 23:44:11 按小时单位 偏移量为-4 返回的日期时间对象应该是 2016-4-5 19:44:11
/*
dateObj 需要计算的原始日期 可以是日期对象，空字符或者包含y,m,d,h,n,s的对象
typeStr Y,M,D,H,N,S 偏移的参考单位
distance 偏移的数量值，只支持整数形式
返回偏移后的日期时间对象
*/
function getDatetimeDiff(dateObj,typeStr,distance){
	if (dateObj instanceof Date){
	}else{
		if (!dateObj){
			dateObj = new Date();
		}else{
			if ("y" in dateObj){
				dateObj = new Date(dateObj.y+"/"+dateObj.m+"/"+dateObj.d+" "+dateObj.h+":"+dateObj.n+":"+dateObj.s);
			}else{
				dateObj = new Date(dateObj);
			}
		}
	}
	var t = {
		y:  dateObj.getFullYear(),
		m:  dateObj.getMonth()+1,
		d:  dateObj.getDate(),
		h:  dateObj.getHours(),
		n:  dateObj.getMinutes(),
		s:  dateObj.getSeconds()
	};
	var unixTime = getUnixTime(dateObj);
	typeStr=typeStr.toUpperCase();
	distance=isNaN(distance-0)? 0:distance-0;
	switch(typeStr){
		case "Y":
			t.y = t.y + distance;
			dateObj = new Date(t.y+"/"+t.m+"/"+t.d+" "+t.h+":"+t.n+":"+t.s);
			break;
		case "M":
			var temp = getExcursion(12,1,t.m,distance);
			if (temp){
				t.y = t.y + temp.hex;
				t.m = temp.base;
			}
			dateObj = new Date(t.y+"/"+t.m+"/"+t.d+" "+t.h+":"+t.n+":"+t.s);
			break;
		case "D":
			unixTime += distance * 24 * 60 * 60 * 1000;
			dateObj = new Date(getStringTime(unixTime));
			break;
		case "H":
			unixTime += distance * 60 * 60 * 1000;
			dateObj = new Date(getStringTime(unixTime));
			break;
		case "N":
			unixTime += distance * 60 * 1000;
			dateObj = new Date(getStringTime(unixTime));
			break;
		case "S":
			unixTime += distance * 1000;
			dateObj = new Date(getStringTime(unixTime));
			break;
	}
	return dateObj;
}

//========= 数值偏移函数 ========================================
//按所传递的进制计算需要数值的一定距离后的数值对象，包含了原单位计算后的值和其进度位需要调整的值，这里用于应对时间和月份的移动
//== 参数说明 ======
// maxV 进制数中最大数值 10进制数据这里填写9 因为单位最大值是9 月份这里填写12 小时这里填写23 分钟这里填写59
// minV 进制数种最小数值 10进制数据这里填写0 月份这里填写1 小时这里填写0 分钟这里填写0
// nowV 当前的值 
// distance 偏移量 正数表示往正方向移动 或者说往日期时间的未来移动 负数则相反
//== 返回值 ========
//返回值是对象，包含两个元素 base表示当前经过移动后的单位值，hex表示其上一位的进制数据的偏移值
//== exp ===========
//getExcursion(9,0,5,10) //把数值5往正方向偏移10个单位，所以返回数据是{base:5,hex:1} 按10进制的数据解释 hex*10+base = 15 
//getExcursion(12,1,4,-10) //把4月份往历史移动10个月份，所以返回数据是{base:6,hex:-1} 按日期的解释就是 年份偏移值-1，月份为6 所以当前如果是2016年的话，经过-10个月的偏移 应该是2016-1年6月，即2015年6月份

function getExcursion(maxV,minV,nowV,distance){
	if (!distance || distance===0) return {base:nowV,hex:0};
	var tempValue = nowV + distance;
	var nowCount = 0;
	var loopCount = 0;
	var maxLoop = 100;
	if (tempValue > maxV){
		while(tempValue > maxV && loopCount<maxLoop){
			nowCount++;
			tempValue -= maxV - minV + 1;
			loopCount++;
		}
	}else if (tempValue < minV){
		nowCount = 0;
		while(tempValue < minV && loopCount<maxLoop){
			nowCount--;
			tempValue += maxV - minV + 1;
			loopCount++;
		}
	}
	if (loopCount >= maxLoop){
		return false;
	}else{
		return {base:tempValue,hex:nowCount};
	}
}

//判断闰年
function learYear(year){
	if (!(year - 0)) return false;
	if (year % 4!==0) return false;
	if (year % 400===0) return true;
	return (year % 100===0);
}



//获得url中的get参数
//name 需要获得参数的名称
function getUrlQuery(name){
  var reg = new RegExp("(^|&)"+ name +"=([^&]*)(&|$)");
  var r = window.location.search.substr(1).match(reg);
  if (r!==null) return decodeURIComponent(r[2]);
  return null;
}


//比较对象是否相等
function compareObject(x, y){
	// If both x and y are null or undefined and exactly the same 
	if (x===y) return true;
	
	// If they are not strictly equal, they both need to be Objects 
	if (!(x instanceof Object) || !(y instanceof Object)) return false;
	
	//They must have the exact same prototype chain,the closest we can do is
	//test the constructor. 
	if (x.constructor!==y.constructor) return false;

	for (var p in x){
		//Inherited properties were tested using x.constructor === y.constructor
		if (x.hasOwnProperty(p)){
			// Allows comparing x[ p ] and y[ p ] when set to undefined 
			if (!y.hasOwnProperty(p)) return false;
			// If they have the same strict value or identity then they are equal 
			if (x[p]===y[p]) continue;
			
			// Numbers, Strings, Functions, Booleans must be strictly equal 
			if (typeof(x[p])!=="object") return false;
			
			var cmpTemp=compareObject(x[p], y[p]);
			if (cmpTemp==false) return false;
			// Objects and Arrays must be tested recursively 
			//if (!Object.equals(x[p], y[p])){
				//return false;
			//}
		}
	}
	for (p in y){
		// allows x[ p ] to be set to undefined
		if (y.hasOwnProperty(p) && !x.hasOwnProperty(p)) return false;
	}
	return true; 
};


//返回当前客户端是PC端还是移动端
//pc端返回 字符串 pc 否则返回mobile
function checkClientEQ(){
	var type="pc";
	if ("ontouchstart" in window){
		var userAgentInfo=navigator.userAgent; 
		var Agents=["iphone","android","symbianos","windows phone","ipad","ipod"];
		for (var v=0; v<Agents.length; v++){
			if (userAgentInfo.toLowerCase().indexOf(Agents[v])!==-1){
				type=Agents[v];
				break;
			}
		}
		if (type==="windows phone"){
			return "mobile";
		}else{
			if (type!=="pc"){
				if (navigator.platform.toLowerCase()==="win32"){
					return "pc";
				}else{
					return "mobile";
				}
			}else{
				return "pc";
			}
		}
	}else{
		return "pc";
	}
}

//---------------------------------- 本站专用 ----------------
//获得URL起始地址
var CFGURL='';
try{
	CFGURL=document.getElementById('URL').innerText;
}catch(e){
}