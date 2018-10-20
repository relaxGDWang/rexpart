//utf8 界面对话框
/*
author relax since 2016/8
ver 1.3.1 2018/1/25
require jQuery,relax_function.js
dom config
	noclick="noclick" 用于设置mask层是否能响应点击关闭对话框
	class="white" 用于设置展示的mask层为白色
dom diy 用于标题部分，内容部分的替换
@action 由于IE8的点透未作协调处理，请慎用无屏蔽层的弹框
[2018/1/25] modiby 对本模块在ie8进行了兼容性调整,包括JS和css,html书写结构上也有所变化
*/

function relaxDialog(){
  var searchClass = [".extDialog",".extMenu",".extPage",".miniDialog"];  //弹出框，移入式菜单，移入式页面，自隐对话框

  var list={};          //记录对话框对象
	var pcFlag=true;      //判定客户端是移动端还是pc端
	var ie8Flag=false;
	var tempDom=document.createElement("div")
	if ("ontouchstart" in tempDom) pcFlag=false;
	if (("addEventListener" in tempDom)===false) ie8Flag=true;
	var zIndexNum=0;      //记录当前css样式表中定义的zIndex
	var zList=[];         //按各窗口打开的z序排列
	var timeID;           //用于协调resize事件
	var bH=$("body").height();   //用于记录当前body的高
	var mH=pcFlag? 0.8: 0.9;     //用于记录dialog的最大高度占比值
  var x;                //用于遍历对象循环
/*
list结构
	dom 当前的对话框对象
	type 对话框类型 dialog/menu/page/minidialog
	show 对话框当前是否展现 true/false
	title 对话框的title dom
	content 对话框的 content dom
	buttonbar 对话框的 按钮部分 dom
	classname 对话框的原始className字符串
*/
	for (var i=0; i<searchClass.length; i++){
		(function(index){
			var tempArray = $(searchClass[index]);
			for (var i=0; i<tempArray.length; i++){
				if (tempArray[i].id){
					var tempDom=tempArray[i];
					list[tempDom.id]={};
					var tempVar=list[tempDom.id];
					tempVar.dom=$(tempDom);
					tempVar.open="";
					tempVar.close="";
					tempVar.type=searchClass[index].replace(".","").replace("ext","").toLowerCase();
					tempVar.title=$(tempDom).find(".dialog-title").eq(0);
					tempVar.content=$(tempDom).find(".dialog-content").eq(0);
					tempVar.buttonbar=$(tempDom).find(".dialog-buttonBar").eq(0);
					tempVar.classname=$(tempDom)[0].className;
					//绑定屏蔽层事件
					//@action 2018/1/25 对于现代浏览器，似乎不存在事件点透的概念，目前IE8测试下来会有此问题，所以暂不作无屏蔽层的弹出框的协调处理，等后期再做完善
					if (tempVar.type==="dialog" || tempVar.type==="menu"){
						tempVar.dom.click(function(e){
							if (e.target!==this) return;
							if ($(this).attr("noclick")) return;
							dialogClose(this.id,"close",null,true);
							protectEvent(e);
						});
					}
				}
			}
		})(i);
	}

	//获得z序
	for (x in list){
		zIndexNum=parseInt(list[x].dom.css("zIndex")); break;
	}
	//重置dialog的max-height
  _fitMaxheight();

	//绑定弹出框中窗口的按钮一般事件
	for (x in list){
		(function(JQobj){
			//取消按钮事件
			JQobj.find(".opBnt").on("click",function(e){
				var typeStr=this.className.replace(/.*(bnt-sure|bnt-cancel|bnt-close).*/g,"$1");
				if (typeStr===this.className){
					typeStr="";
				}else{
          typeStr=typeStr.replace("bnt-","");
				}
				if (typeStr==="") return;
        if ($(this).attr("href")){
					var nowHref=$(this).attr("href");
					dialogClose(JQobj[0].id,typeStr,nowHref,true);
        }else{
          dialogClose(JQobj[0].id,typeStr,null,true);
				}
				protectEvent(e);
			});
		})(list[x].dom);
	}

	//resize事件绑定
	$(window).resize(function(){
		if (timeID) return;
		timeID=setTimeout(function(){
      bH=$("body").height();
			_fitMaxheight(true);
			clearTimeout(timeID);
		},300);
	});

//打开对话框
//config 用于对话框展现时候的内容设置
/*
{
	title:标题替换内容 会填写到dialog-title部分的.diy中
	close:true/false 是否在顶部显示关闭按钮，仅用于menu和page对话框，应对某些弹出不允许关闭的情况
	content:内容部分的替换内容，会填写到dialog-content部分的.diy中
	bntsure: 作用于bnt-sure按钮，为""时候不显示，为undefined的时候显示上一次的文本，否则参数值做为确定按钮的文本，以下2个参数类似
	bntcancel:
	bntclose:
	cname:字符串 为打开对话框添加自定义的className字符串，不会破坏原有的className设定，一般用于同一对话框的不同状态的区分显示（需用户在CSS中设定好）
	op:展示方向，仅用于menu或者minidialog，设置left,right,top,bottom，minidialog仅响应top,bottom两项
	openCallback:打开事件
	closeCallback:关闭事件
}
*/
	function dialogShow(idStr,config){
		if (!(idStr in list)) return;

		//如果有对话框打开，当前对打开的对话框不做处理 modify by relax 2016/9/10 可能存在多个对话框同时显示的情况
		var tempObj = list[idStr];
		if (_isShow(tempObj)) return;

		//协调细节
		if (config && typeof(config)==="object"){
			//modify by relax 2017/3/22 对话框的className进行自定义扩展
			if (config.cname){
				tempObj.dom[0].className=tempObj.classname+" "+config.cname;
			}else{
				tempObj.dom[0].className=tempObj.classname;
			}

			//对话框标题重置
			if (config.title) tempObj.title.find(".diy").html(config.title);
			//对话框内容重置 修改为重置dialog-content部分中的.diy中的内容
			if (config.content) tempObj.content.find(".diy").html(config.content);
			//对于menu和page对话框顶部后退按钮的显示不显示控制
			if (tempObj.type==="menu" || tempObj.type==="page"){
				if (config.close===true) tempObj.title.eq(0).find(".bnt-close").css("display","block");
        if (config.close===false) tempObj.title.eq(0).find(".bnt-close").css("display","none");
			}

			//操作按钮协调
			//modify by relax 2017/3/28
			var itemArray = ["bnt-sure","bnt-cancel","bnt-close"];
			tempObj.buttonbar.find(".bnt-sure,.bnt-cancel,.bnt-close").css("display","none");
			for (var j=0; j<itemArray.length; j++){
				var obj = tempObj.buttonbar.find("."+itemArray[j]).eq(0);
				if (obj.length===1){
					var loopStr = itemArray[j].replace("-","");
					if (config[loopStr]!==""){
						//判断当前是用inline-block展现还是block展现
						var flagShow="inline-block";
						if (obj.hasClass("sBlk")) flagShow = "block";
						obj.css("display",flagShow);
						if (config[loopStr]!==undefined) obj.html(config[loopStr]);
					}
				}
			}

			//展示方向绑定
			if (config.op && (tempObj.type==="menu" || tempObj.type==="minidialog")){
				var classNameStr=tempObj.dom[0].className;
				classNameStr=classNameStr.replace(/(^|\s+)(left|right|top|bottom)(\s+|$)/,"$1"+config.op+"$3");
        tempObj.dom[0].className=classNameStr;
			}

			//modify by relax2017/3/28  相关事件的绑定
			if (config.openCallback && typeof(config.openCallback)==="function"){
				tempObj.open=config.openCallback;
			}else{
        tempObj.open="";
			}
			if (config.closeCallback && typeof(config.closeCallback)==="function"){
        tempObj.close=config.closeCallback;
			}else {
        tempObj.close = "";
      }
		}

		_fitZindex(tempObj);  //协调窗口z序
		_show(tempObj);       //显示窗口

		if (tempObj.open) tempObj.open(idStr,tempObj.type);  //执行打开事件
	}

	//关闭对话框
	/*
	参数说明
	idStr 要关闭对话框的id字符，如果不填写或者空字符，则表示关闭所有对话框，关闭所有对话框并不触发原先绑定的关闭事件
	buttonType 当前执行关闭指令的按钮类型，多用于对话框自身按钮的绑定事件
	goUrl 需要跳转的url地址，比如表单提交成功后的提示，点击确定后可能会需要页面刷新或者跳转
	isEvent 用于标记是否是DOM交互进行的关闭操作，而非js的代码指令关闭操作
	*/
	function dialogClose(idStr,buttonType,goUrl,isEvent){
		//全部关闭的情况
		if (idStr==="" || idStr===undefined){
			for (var x in list){
				if (_isShow(list[x])) closeDoing(list[x]);
			}
			return;
		}

		if (!list[idStr] && _isShow(list[idStr])===false) return;

		//如果当前打开的对话框不是需要关闭的对话框，则不做处理
		//modify by relax 如果有多个对话框打开，这里会有问题，目前先注销
		//if (nowShow != idStr) return;
		var tempObj = list[idStr];

		//查看是否绑定关闭事件，如果绑定先执行，且执行返回如果是false则不关闭
		//这里需要判定是人为交互还是js指令，后者可能会引起嵌套死循环
		if (tempObj.close && isEvent){
			var doFlag=tempObj.close(idStr, tempObj.type, buttonType);
			if (doFlag!==undefined && !doFlag) return;
		}

		closeDoing(tempObj);
		if (goUrl) location.href=goUrl;

		//关闭窗口
		function closeDoing(tempObj){
			switch(tempObj.type){
				case "dialog":
					tempObj.dom.removeClass("show");
					break;
				case "menu":
					tempObj.dom.removeClass("show");
					break;
				case "page":
					tempObj.dom.removeClass("show");
					break;
			}

			tempObj.dom.css({"zIndex":zIndexNum});
			var idStr=tempObj.dom[0]["id"];
			var indexNum=zList.indexOf(idStr);
			zList.splice(indexNum,1);
		}
	}

  //协调各打开窗口的z序
  function _fitZindex(tempObj){
    zList.push(tempObj.dom[0]["id"]);
    var nowIndex;
    for (var i=0; i<zList.length; i++){
      if (list[zList[i]].type==="minidialog"){
        nowIndex=zIndexNum*10+i;
        list[zList[i]].dom.css("zIndex",nowIndex);
      }else{
        nowIndex=zIndexNum+i*2;
        list[zList[i]].dom.css("zIndex",nowIndex);
        if (list[zList[i]].domMask) list[zList[i]].domMask.css("zIndex",nowIndex-1);
      }
    }
  }

  //按对话框类型不同进行显示
  function _show(tempObj){
    //协调不同对话框及其屏蔽层的展现
    switch(tempObj.type){
      case "dialog":
        tempObj.dom.addClass("show");
        break;
      case "menu":
        tempObj.dom.addClass("show");
        break;
      case "page":
        tempObj.dom.addClass("show");
        break;
      case "minidialog":
      	tempObj.dom.addClass("show");
        setTimeout(function(){
          tempObj.dom.removeClass("show");
        },2200);
        break;
    }
  }

  //用于协调dialog的max-height属性，主要用于初始加载或者窗口resize
  function _fitMaxheight(flag){
		if (flag){
      for (var i=0,len=zList.length; i<len; i++){
        if (list[zList[i]].type==="dialog"){
          list[zList[i]].content.css("maxHeight",parseInt(bH*mH));
        }
      }
		}else{
			for (var x in list){
				if (list[x].type==="dialog"){
					list[x].content.css("maxHeight",parseInt(bH*mH));
				}
			}
		}
	}

	//对话框是否已经打开，
	function _isShow(item){
		return item.dom.hasClass("show");
	}

	return {
		open: dialogShow,
		close: dialogClose
	}
}
