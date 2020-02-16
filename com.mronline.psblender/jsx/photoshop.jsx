/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, Folder*/
var FolderPath = "",
    startLayerPositionX, startLayerPositionY, startScaleX, startScaleY, startRotation, startTransparency, stepsCounter;
var startRulerUnit = app.preferences.rulerUnits;
var startTypeUnit = app.preferences.typeUnits;

function getLayerData() {
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;
    var docRef = app.activeDocument;
    var origLayer = docRef.activeLayer;
    //duplicate new layers and put it to top
    duplicateLayer();
    convertToSmart();
    moveLayerToTop();
    renameLayer(origLayer.name + "_PsBlendSO");
    var sendLayerName = origLayer.name + "_PsBlendSO";
    //define the x y coordinate of smart object center
    var curLayer = docRef.activeLayer;
    var curLayerBounds = curLayer.bounds;
    var curLayerPositionX = curLayerBounds[0].value + ((curLayerBounds[2].value - curLayerBounds[0].value) / 2);
    var curLayerPositionY = curLayerBounds[1].value + ((curLayerBounds[3].value - curLayerBounds[1].value) / 2);
    startLayerPositionX = curLayerPositionX;
    startLayerPositionY = curLayerPositionY;
    startScaleX = parseFloat(100);
    startScaleY = parseFloat(100);
    startRotation = parseFloat(0);
    startTransparency = parseFloat(curLayer.fillOpacity);
    var concatValue = curLayerPositionX + "&&&&" + curLayerPositionY + "&&&&" + startScaleX + "&&&&" + startScaleY + "&&&&" + startRotation + "&&&&" + startTransparency + "&&&&" + sendLayerName;
    return concatValue;
    // try {
    // // docRef.activeLayer.resize(50,50,AnchorPosition.MIDDLECENTER);
    // rotateLayer(-50);
    // }
    // catch(e){
    //   alert(e);
    // }
}
// 
// generatePreview("276&&&&432.5&&&&100&&&&100&&&&0&&&&100");
function generatePreview(data) {
    var newLayerPositionX = data.split("&&&&")[0];
    var newLayerPositionY = data.split("&&&&")[1];
    var newLayerScaleX = data.split("&&&&")[2];
    var newLayerScaleY = data.split("&&&&")[3];
    var newLayerRotation = data.split("&&&&")[4];
    var newLayerTransparency = data.split("&&&&")[5];
    // var xTransform = parseFloat(newLayerPositionX) - parseFloat(startLayerPositionX);
    // var yTransform = parseFloat(newLayerPositionY) - parseFloat(startLayerPositionY);
    // var xScale = parseFloat(newLayerScaleX) - parseFloat(startScaleX);
    // var yScale = parseFloat(newLayerScaleY) - parseFloat(startScaleY);
    var xTransform = parseFloat(newLayerPositionX) - parseFloat(startLayerPositionX);
    var yTransform = parseFloat(newLayerPositionY) - parseFloat(startLayerPositionY);
    var xScale = parseFloat(newLayerScaleX);
    var yScale = parseFloat(newLayerScaleY);
    var rot = parseFloat(newLayerRotation);
    var trans = parseFloat(newLayerTransparency);
    // alert(xTransform + "&&&&" + yTransform + "&&&&" + xScale + "&&&&" + yScale + "&&&&" + rot + "&&&&" + trans) 
    try {
        transformLayer(xTransform, yTransform);
        resizeLayer(xScale, yScale);
        rotateLayer(rot);
        changeTransparency(trans);
    } catch (e) {
        alert(e);
    }
}

function generateBlend(data) {
    //Get user's input from panel
    var newLayerPositionX = data.split("&&&&")[0];
    var newLayerPositionY = data.split("&&&&")[1];
    var newLayerScaleX = data.split("&&&&")[2];
    var newLayerScaleY = data.split("&&&&")[3];
    var newLayerRotation = data.split("&&&&")[4];
    var newLayerTransparency = data.split("&&&&")[5];
    var steps = parseInt(data.split("&&&&")[6]);
    //calculates the difference between values where start values are the real data and new values are user input
    var xTransform = parseFloat(newLayerPositionX) - parseFloat(startLayerPositionX);
    var yTransform = parseFloat(newLayerPositionY) - parseFloat(startLayerPositionY);
    var xScale = parseFloat(newLayerScaleX) - parseFloat(startScaleX); //if positive then increase size and on negative decrease
    var yScale = parseFloat(newLayerScaleY) - parseFloat(startScaleY);
    var rot = parseFloat(newLayerRotation) - parseFloat(startRotation);
    var trans = parseFloat(newLayerTransparency) - parseFloat(startTransparency);
    //dummy variables to call after every increment in for loop
    var masterScaleX = parseFloat(startScaleX);
    var masterScaleY = parseFloat(startScaleY);
    var masterRotation = parseFloat(startRotation);
    var masterTransparency = parseFloat(startTransparency);
    //create a new smart object to start copying and cloning layers (steps)
    editSmartObject();
    duplicateLayer();
    moveLayerBelow();
    convertToSmart();
    renameLayer("SmartObject");
    //stores SO width and height for calculating bonus disPlacement
    var SOBounds = app.activeDocument.activeLayer.bounds;
    var SOWidth = SOBounds[2].value - SOBounds[0].value;
    var SOHeight = SOBounds[3].value - SOBounds[1].value;
    //define masterPositionX and Y because startPositionX is the value of layers bound which lies in original document while our current layer lies in the smart object of original document so bounds need to be updated
    var docRef = app.activeDocument;
    var curLayer = docRef.activeLayer;
    var curLayerBounds = curLayer.bounds;
    var curLayerPositionX = curLayerBounds[0].value + ((curLayerBounds[2].value - curLayerBounds[0].value) / 2);
    var curLayerPositionY = curLayerBounds[1].value + ((curLayerBounds[3].value - curLayerBounds[1].value) / 2);
    var masterPositionX = parseFloat(curLayerPositionX);
    var masterPositionY = parseFloat(curLayerPositionY);
    //generates incremental values i.e. 50px move in 5 steps gives 10px per step.
    var splitPositionX = (parseFloat(xTransform) / steps);
    var splitPositionY = parseFloat(yTransform) / steps;
    var splitScaleX = parseFloat(xScale) / steps;
    var splitScaleY = parseFloat(yScale) / steps;
    var splitRotation = parseFloat(rot) / steps;
    var splitTransparency = parseFloat(trans) / steps;
    //the main code for generating blends starts here
    for (var i = 0; i < steps; i++) {
        //updates masterPositing by adding splits
        //Photoshop DOM Scale method is relative rather than absolute so if we will change scale to 50 then it won't resize object by 50% but it will resize objects half by it's current size so we need to tweak resize method
        var masterScaleX = parseFloat(((masterScaleX + splitScaleX) * 100) / masterScaleX);
        var masterScaleY = parseFloat(((masterScaleY + splitScaleY) * 100) / masterScaleY);
        var masterRotation = masterRotation + parseFloat(splitRotation);
        var masterTransparency = masterTransparency + parseFloat(splitTransparency);
        //starts looping in where order will be duplicate SO-clear mask-move downside-apply transformation-select above layer-select bound-below layer mask (This all steps are what makes blend layers)
        try {
            duplicateLayer();
            moveLayerBelow();
            if (hasMask() == true) {
                selectLayerMask();
                deleteLayerMask();
            }
            resizeLayer(masterScaleX, masterScaleY);
            
            rotateLayer(masterRotation);
            //after resizing adjust the masterPosition
            var layBounds = app.activeDocument.activeLayer.bounds;
            var layWidth = layBounds[2].value - layBounds[0].value;
            var layHeight = layBounds[3].value - layBounds[1].value;
            var PositionDifferenceX = SOWidth - layWidth; 
            var PositionDifferenceY = SOHeight - layHeight;
            SOWidth = layWidth;
            SOHeight = layHeight;
            masterPositionX = masterPositionX + parseFloat(splitPositionX) + parseFloat(Math.abs(PositionDifferenceX));
            masterPositionY = masterPositionY + parseFloat(splitPositionY) + parseFloat(Math.abs(PositionDifferenceY));
            var splitPosX = parseFloat(splitPositionX) + parseFloat(Math.abs(PositionDifferenceX));
            var splitPosY = parseFloat(splitPositionY) + parseFloat(Math.abs(PositionDifferenceY));
            // alert("X: " + splitPosX + " Y: " + splitPosY);  
            //continue tasks
            transformLayer(parseFloat(splitPosX), parseFloat(splitPosY));
            // alert(masterRotation);
            changeTransparency(masterTransparency);
            revealAll();
            selectAboveLayer();
            selectBoundOfLayer()
            selectBelowLayer();
            createMask();
            invert();
            trim();
        } catch (e) {
            alert(e);
        }
    }
}

function transformLayer(xDisplacement, yDisplacement) {
    app.preferences.rulerUnits = Units.PIXELS;
    app.preferences.typeUnits = TypeUnits.PIXELS;
    //displacements are difference but not absolute position. displacement 1 = +1 in the position;
    var idTrnf = charIDToTypeID("Trnf");
    var desc195 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref22 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref22.putEnumerated(idLyr, idOrdn, idTrgt);
    desc195.putReference(idnull, ref22);
    var idFTcs = charIDToTypeID("FTcs");
    var idQCSt = charIDToTypeID("QCSt");
    var idQcsa = charIDToTypeID("Qcsa");
    desc195.putEnumerated(idFTcs, idQCSt, idQcsa);
    var idOfst = charIDToTypeID("Ofst");
    var desc196 = new ActionDescriptor();
    var idHrzn = charIDToTypeID("Hrzn");
    var idPxl = charIDToTypeID("#Pxl");
    desc196.putUnitDouble(idHrzn, idPxl, xDisplacement);
    var idVrtc = charIDToTypeID("Vrtc");
    var idPxl = charIDToTypeID("#Pxl");
    desc196.putUnitDouble(idVrtc, idPxl, yDisplacement);
    var idOfst = charIDToTypeID("Ofst");
    desc195.putObject(idOfst, idOfst, desc196);
    var idLnkd = charIDToTypeID("Lnkd");
    desc195.putBoolean(idLnkd, true);
    var idIntr = charIDToTypeID("Intr");
    var idIntp = charIDToTypeID("Intp");
    var idBcbc = charIDToTypeID("Bcbc");
    desc195.putEnumerated(idIntr, idIntp, idBcbc);
    executeAction(idTrnf, desc195, DialogModes.NO);
}

function resizeLayer(xScale, yScale) {
    app.activeDocument.activeLayer.resize(xScale, yScale, AnchorPosition.MIDDLECENTER);
}

function moveLayerTo(xDisplacement, yDisplacement) { //this is relative position 10 means current x plus 10
    var Position = app.activeDocument.activeLayer.bounds;
    Position[0] = xDisplacement - Position[0];
    Position[1] = yDisplacement - Position[1];
    app.activeDocument.activeLayer.translate(-Position[0], -Position[1]);
}

function duplicateLayer() {
    var idCpTL = charIDToTypeID("CpTL");
    executeAction(idCpTL, undefined, DialogModes.NO);
}

function moveLayerToTop() {
    var idmove = charIDToTypeID("move");
    var desc2645 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref429 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref429.putEnumerated(idLyr, idOrdn, idTrgt);
    desc2645.putReference(idnull, ref429);
    var idT = charIDToTypeID("T   ");
    var ref430 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idFrnt = charIDToTypeID("Frnt");
    ref430.putEnumerated(idLyr, idOrdn, idFrnt);
    desc2645.putReference(idT, ref430);
    executeAction(idmove, desc2645, DialogModes.NO);
}

function convertToSmart() {
    var idnewPlacedLayer = stringIDToTypeID("newPlacedLayer");
    executeAction(idnewPlacedLayer, undefined, DialogModes.NO);
}

function renameLayer(name) {
    app.activeDocument.activeLayer.name = name;
}

function rotateLayer(rotation) {
    app.activeDocument.activeLayer.rotate(rotation, AnchorPosition.MIDDLECENTER);
}

function changeTransparency(alpha) {
    app.activeDocument.activeLayer.fillOpacity = parseFloat(alpha);
}

function selectBoundOfLayer() {
    var idsetd = charIDToTypeID("setd");
    var desc730 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref286 = new ActionReference();
    var idChnl = charIDToTypeID("Chnl");
    var idfsel = charIDToTypeID("fsel");
    ref286.putProperty(idChnl, idfsel);
    desc730.putReference(idnull, ref286);
    var idT = charIDToTypeID("T   ");
    var ref287 = new ActionReference();
    var idChnl = charIDToTypeID("Chnl");
    var idChnl = charIDToTypeID("Chnl");
    var idTrsp = charIDToTypeID("Trsp");
    ref287.putEnumerated(idChnl, idChnl, idTrsp);
    desc730.putReference(idT, ref287);
    executeAction(idsetd, desc730, DialogModes.NO);
}

function selectBelowLayer() {
    var idslct = charIDToTypeID("slct");
    var desc487 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref125 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idBckw = charIDToTypeID("Bckw");
    ref125.putEnumerated(idLyr, idOrdn, idBckw);
    desc487.putReference(idnull, ref125);
    var idMkVs = charIDToTypeID("MkVs");
    desc487.putBoolean(idMkVs, false);
    var idLyrI = charIDToTypeID("LyrI");
    var list37 = new ActionList();
    list37.putInteger(2);
    desc487.putList(idLyrI, list37);
    executeAction(idslct, desc487, DialogModes.NO);
}

function selectAboveLayer() {
    var idslct = charIDToTypeID("slct");
    var desc248 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref69 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idFrwr = charIDToTypeID("Frwr");
    ref69.putEnumerated(idLyr, idOrdn, idFrwr);
    desc248.putReference(idnull, ref69);
    var idMkVs = charIDToTypeID("MkVs");
    desc248.putBoolean(idMkVs, false);
    var idLyrI = charIDToTypeID("LyrI");
    var list14 = new ActionList();
    list14.putInteger(11);
    desc248.putList(idLyrI, list14);
    executeAction(idslct, desc248, DialogModes.NO);
}

function createMask() {
    var idMk = charIDToTypeID("Mk  ");
    var desc488 = new ActionDescriptor();
    var idNw = charIDToTypeID("Nw  ");
    var idChnl = charIDToTypeID("Chnl");
    desc488.putClass(idNw, idChnl);
    var idAt = charIDToTypeID("At  ");
    var ref126 = new ActionReference();
    var idChnl = charIDToTypeID("Chnl");
    var idChnl = charIDToTypeID("Chnl");
    var idMsk = charIDToTypeID("Msk ");
    ref126.putEnumerated(idChnl, idChnl, idMsk);
    desc488.putReference(idAt, ref126);
    var idUsng = charIDToTypeID("Usng");
    var idUsrM = charIDToTypeID("UsrM");
    var idRvlS = charIDToTypeID("RvlS");
    desc488.putEnumerated(idUsng, idUsrM, idRvlS);
    executeAction(idMk, desc488, DialogModes.NO);
}

function invert() {
    var idInvr = charIDToTypeID("Invr");
    executeAction(idInvr, undefined, DialogModes.NO);
}

function clearMask() {
    var idDlt = charIDToTypeID("Dlt ");
    var desc498 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref134 = new ActionReference();
    var idChnl = charIDToTypeID("Chnl");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref134.putEnumerated(idChnl, idOrdn, idTrgt);
    desc498.putReference(idnull, ref134);
    executeAction(idDlt, desc498, DialogModes.NO);
}

function editSmartObject() {
    var idplacedLayerEditContents = stringIDToTypeID("placedLayerEditContents");
    var desc241 = new ActionDescriptor();
    executeAction(idplacedLayerEditContents, desc241, DialogModes.NO);
}

function moveLayerBelow() {
    var idmove = charIDToTypeID("move");
    var desc244 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref64 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref64.putEnumerated(idLyr, idOrdn, idTrgt);
    desc244.putReference(idnull, ref64);
    var idT = charIDToTypeID("T   ");
    var ref65 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idPrvs = charIDToTypeID("Prvs");
    ref65.putEnumerated(idLyr, idOrdn, idPrvs);
    desc244.putReference(idT, ref65);
    executeAction(idmove, desc244, DialogModes.NO);
}

function moveLayerAbove() {
    var idmove = charIDToTypeID("move");
    var desc246 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref66 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idTrgt = charIDToTypeID("Trgt");
    ref66.putEnumerated(idLyr, idOrdn, idTrgt);
    desc246.putReference(idnull, ref66);
    var idT = charIDToTypeID("T   ");
    var ref67 = new ActionReference();
    var idLyr = charIDToTypeID("Lyr ");
    var idOrdn = charIDToTypeID("Ordn");
    var idNxt = charIDToTypeID("Nxt ");
    ref67.putEnumerated(idLyr, idOrdn, idNxt);
    desc246.putReference(idT, ref67);
    executeAction(idmove, desc246, DialogModes.NO);
}

function resetSwatches() {
    var idRset = charIDToTypeID("Rset");
    var desc293 = new ActionDescriptor();
    var idnull = charIDToTypeID("null");
    var ref84 = new ActionReference();
    var idClr = charIDToTypeID("Clr ");
    var idClrs = charIDToTypeID("Clrs");
    ref84.putProperty(idClr, idClrs);
    desc293.putReference(idnull, ref84);
    executeAction(idRset, desc293, DialogModes.NO);
}

function hasMask() {
    var lm = true,
        pmd;
    try {
        var doc = app.activeDocument;
        pmd = doc.activeLayer.layerMaskDensity;
        doc.activeLayer.layerMaskDensity = 50.0;
        doc.activeLayer.layerMaskDensity = pmd;
    } catch (e) {
        lm = false
    };
    return lm;
};

function selectLayerMask() {
    try {
        var id759 = charIDToTypeID("slct");
        var desc153 = new ActionDescriptor();
        var id760 = charIDToTypeID("null");
        var ref92 = new ActionReference();
        var id761 = charIDToTypeID("Chnl");
        var id762 = charIDToTypeID("Chnl");
        var id763 = charIDToTypeID("Msk ");
        ref92.putEnumerated(id761, id762, id763);
        desc153.putReference(id760, ref92);
        var id764 = charIDToTypeID("MkVs");
        desc153.putBoolean(id764, false);
        executeAction(id759, desc153, DialogModes.NO);
    } catch (e) {
        ; // do nothing
    }
}

function deleteLayerMask() {
    try {
        var idDlt = charIDToTypeID("Dlt ");
        var desc6 = new ActionDescriptor();
        var idnull = charIDToTypeID("null");
        var ref5 = new ActionReference();
        var idChnl = charIDToTypeID("Chnl");
        var idOrdn = charIDToTypeID("Ordn");
        var idTrgt = charIDToTypeID("Trgt");
        ref5.putEnumerated(idChnl, idOrdn, idTrgt);
        desc6.putReference(idnull, ref5);
        executeAction(idDlt, desc6, DialogModes.NO);
    } catch (e) {
        ; // do nothing
    }
}

function revealAll() {
    var idRvlA = charIDToTypeID("RvlA");
    var desc888 = new ActionDescriptor();
    executeAction(idRvlA, desc888, DialogModes.NO);
}

function trim() {
    var idtrim = stringIDToTypeID("trim");
    var desc892 = new ActionDescriptor();
    var idtrimBasedOn = stringIDToTypeID("trimBasedOn");
    var idtrimBasedOn = stringIDToTypeID("trimBasedOn");
    var idTrns = charIDToTypeID("Trns");
    desc892.putEnumerated(idtrimBasedOn, idtrimBasedOn, idTrns);
    var idTop = charIDToTypeID("Top ");
    desc892.putBoolean(idTop, true);
    var idBtom = charIDToTypeID("Btom");
    desc892.putBoolean(idBtom, true);
    var idLeft = charIDToTypeID("Left");
    desc892.putBoolean(idLeft, true);
    var idRght = charIDToTypeID("Rght");
    desc892.putBoolean(idRght, true);
    executeAction(idtrim, desc892, DialogModes.NO);
}