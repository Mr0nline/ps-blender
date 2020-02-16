var startJSON, midJSON, endJSON, imageJSON = "", textJSON = "", sourceLayerName, canPreview;



function allowDrop(ev) {
	ev.preventDefault();
}
function allowDropImage(ev) {
	ev.preventDefault();
	document.getElementById("input_image").style["border"] = "1.5px dashed rgba(135,206,250,1)";
	document.getElementById("input_image").style["background-color"] = "rgba(135,206,250,0.35)";
}
function leaveDropImage(ev) {
	ev.preventDefault();
	document.getElementById("input_image").style["border"] = "1.5px dashed";
	document.getElementById("input_image").style["background-color"] = "transparent";
}
function drop_image(ev) {
	ev.preventDefault();
	document.getElementById("input_image").style["border"] = "1.5px dashed";
	document.getElementById("input_image").style["background-color"] = "transparent";
	canPreview = true;
	document.getElementById("get_image_data").click();
}
function setInputFilter(textbox, inputFilter) {
	["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function(event) {
	  textbox.addEventListener(event, function() {
		if (inputFilter(this.value)) {
		  this.oldValue = this.value;
		  this.oldSelectionStart = this.selectionStart;
		  this.oldSelectionEnd = this.selectionEnd;
		} else if (this.hasOwnProperty("oldValue")) {
		  this.value = this.oldValue;
		  this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
		} else {
		  this.value = "";
		}
	  });
	});
  }
//makes values only float e.g. 250.35
setInputFilter(document.getElementById("position_x"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
setInputFilter(document.getElementById("position_y"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
setInputFilter(document.getElementById("scale_x"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
setInputFilter(document.getElementById("scale_y"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
setInputFilter(document.getElementById("rotation"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
setInputFilter(document.getElementById("transparency"), function(value) {
	return /^-?\d*[.,]?\d*$/.test(value);
})
  
$(document).ready(function() {
	document.getElementById("get_static_data").click();
});

//csInterface task
(function () {
	'use strict';
	var csInterface = new CSInterface();
	//persistency
	function persistent(){
		var gExtensionId = "com.mronline.psblender";
		var event = new CSEvent("com.adobe.PhotoshopPersistent", "APPLICATION");
		event.extensionId = gExtensionId;
		csInterface.dispatchEvent(event);
	}
	// persistent();
	function init() {
		themeManager.init();
		//js to jsx
		$("#get_image_data").click(function () {
			csInterface.evalScript('getLayerData()' , function(result){
				$("#position_x").val(parseFloat(result.split("&&&&")[0]));
				$("#position_y").val(parseFloat(result.split("&&&&")[1]));
				$("#scale_x").val(parseFloat(result.split("&&&&")[2]));
				$("#scale_y").val(parseFloat(result.split("&&&&")[3]));
				$("#rotation").val(parseFloat(result.split("&&&&")[4]));
				$("#transparency").val(parseFloat(result.split("&&&&")[5]));
				sourceLayerName = result.split("&&&&")[6];
			});
		});
		$("#preview_blend").click(function () {
			if (canPreview == true) {
				var xPos = document.getElementById("position_x").value;
				var yPos = document.getElementById("position_y").value;
				var xScl = document.getElementById("scale_x").value;
				var yScl = document.getElementById("scale_y").value;
				var rot = document.getElementById("rotation").value;
				var trns = document.getElementById("transparency").value;
				var concatData = xPos + "&&&&" + yPos + "&&&&" + xScl + "&&&&" + yScl + "&&&&" + rot + "&&&&"+ trns;
				// prompt("",concatData);
				csInterface.evalScript('generatePreview(' + JSON.stringify(concatData) + ')');
			} else {
				alert("Select target layer first");
			}
		});
		$("#generate_blend").click(function () {
			var steps = document.getElementById("steps").value;
			if (steps == "") {
				alert("Specify the steps");	
			} else {
				var xPos = document.getElementById("position_x").value;
				var yPos = document.getElementById("position_y").value;
				var xScl = document.getElementById("scale_x").value;
				var yScl = document.getElementById("scale_y").value;
				var rot = document.getElementById("rotation").value;
				var trns = document.getElementById("transparency").value;
				var concatData = xPos + "&&&&" + yPos + "&&&&" + xScl + "&&&&" + yScl + "&&&&" + rot + "&&&&"+ trns + "&&&&" + steps;
				// prompt("",concatData);
				csInterface.evalScript('generateBlend(' + JSON.stringify(concatData) + ')');
			}
		});
		$("#get_text_data").click(function () {
			csInterface.evalScript('textJSON()' , function(result){
				var textSplit = textJSON.split("}");
				if (textSplit[textSplit.length-1] == "\n    ") {
					textSplit[textSplit.length-1] = ",\n    "
				}
				var changedTextJSON = textSplit.join("}");
				textJSON = changedTextJSON + result + "\n    ";
				$("#output_window").val(startJSON + imageJSON + midJSON + textJSON + endJSON);
			});
		});
		$("#get_static_data").click(function () {
			csInterface.evalScript('setStaticData()' , function(result){
				startJSON = result.split("&&&")[0];
				midJSON = result.split("&&&")[1];
				endJSON = result.split("&&&")[2];
				$("#output_window").val(startJSON + "\n IMAGES JSON WILL COME HERE\n" + midJSON + "\n TEXT JSON WILL COME HERE\n" + endJSON);
			});
		});
		$("#generate_json").click(function() {
			var JSONdata = document.getElementById("output_window").value;
			csInterface.evalScript('generateJSON(' + JSON.stringify(JSONdata) + ')');
		});
		$("#reset_initials").click(function () {//reset values of startJSON midJSOn and endJSON
			document.getElementById("get_static_data").click();
		});
		$("#info").click(function () {//reset values of startJSON midJSOn and endJSON
			csInterface.evalScript('setInfo()');
		});
	}
		
	init();

}());
	
