/**
 * @file Phi Parser
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 * @private
 * Modified by Jiyao Wang / https://github.com/ncbi/icn3d
 */


iCn3DUI.prototype.PhiParser = function(pdbid, type, contour) { var me = this, ic = me.icn3d; "use strict";
    //var url = "https://edmaps.rcsb.org/maps/" + pdbid.toLowerCase() + "_" + type + ".dsn6";
    //me.PhiParserBase(url, type, contour);
};

iCn3DUI.prototype.PhiParserBase = function(url, type, contour) { var me = this, ic = me.icn3d; "use strict";
    var dataType;

    var bCid = undefined;

    //https://stackoverflow.com/questions/33902299/using-jquery-ajax-to-download-a-binary-file
/*
    if(type == '2fofc' && me.bAjax2fofc) {
        ic.mapData.contour2 = contour;
        me.setOption('map', type);
    }
    else if(type == 'fofc' && me.bAjaxfofc) {
        ic.mapData.contour = contour;
        me.setOption('map', type);
    }
    else {
*/
        var oReq = new XMLHttpRequest();
        oReq.open("GET", url, true);

        if(type == 'phiurl') {
            oReq.responseType = "arraybuffer";
        }
        else {
            oReq.responseType = "text";
        }

        oReq.onreadystatechange = function() {
            if (this.readyState == 4) {
               //me.hideLoading();

               if(this.status == 200) {
                   var data = oReq.response;

                   if(type == 'phiurl') {
                       me.loadPhiData(data, contour);
                   }
                   else {
                       me.loadCubeData(data, contour);
                   }

                   me.bAjaxPhi = true;

                   me.setOption('phimap', 'phi');
                }
                else {
                    alert("The potential file is unavailable...");
                }

                if(me.deferredPhimap !== undefined) me.deferredPhimap.resolve();
            }
            else {
                me.showLoading();
            }
        };

        oReq.send();
//    }
};

iCn3DUI.prototype.loadPhiData = function(data, contour) { var me = this, ic = me.icn3d; "use strict";
    // http://compbio.clemson.edu/downloadDir/delphi/delphi_manual8.pdf
    // Delphi phi map is almost the same as GRASP potential map except the last line in Delphi phi map
    //   has five float values and the last value is the grid size.

    var header = {};
    header.filetype = 'phi';

    var bin = (data.buffer && data.buffer instanceof ArrayBuffer) ? data.buffer : data;
//var byteView = new Uint8Array(bin);

    // skip 4 bytes before and after each line
    //http://compbio.clemson.edu/downloadDir/delphi/delphi_manual8.pdf
    //character*20 uplbl
    //character*10 nxtlbl,character*60 toplbl
    //real*4 phi(65,65,65)
    //character*16 botlbl
    //real*4 scale,oldmid(3)

//var headStr = String.fromCharCode.apply(null, byteView.subarray(0, 106));
//var uplbl = headStr.substr(4, 20); // 20 chars, 0-28, skip 4 bytes at both ends
//var nxtlbl = headStr.substr(32, 70); // 70 chars, 28-106, skip 4 bytes at both ends

    // 16 chars, bin.byteLength-52 : bin.byteLength-28, skip 4 bytes at both ends
//var botlbl = String.fromCharCode.apply(null, byteView.subarray(byteView.length - 48, byteView.length - 32));

    // 20 chars, bin.byteLength-28 : bin.byteLength, skip 4 bytes at both ends
    var scale_center = new Float32Array(bin.slice(bin.byteLength-24, bin.byteLength-8) ); // 4 values
    header.scale = scale_center[0];
    var cx = scale_center[1], cy = scale_center[2], cz = scale_center[3];

    // gridSize
    header.n = new Int32Array(bin.slice(bin.byteLength-8, bin.byteLength-4) ); // 1 value, skip the last 4 bytes

    header.xExtent = header.yExtent = header.zExtent = header.n;

    var step = 1.0/header.scale;
    var half_size = step * ((header.n - 1) / 2);
    header.ori = new THREE.Vector3(cx - half_size, cy - half_size, cz - half_size);

    // matrix: n*n*n*4 chars, 106 : bin.byteLength-52, skip 4 bytes at both ends
    // In .phi file, correctly loop x, then y, then z
    var floatView = new Float32Array(bin.slice(110, bin.byteLength-56) ); // 4 values

    ic.mapData.headerPhi = header;
    ic.mapData.dataPhi = floatView;
    ic.mapData.contourPhi = contour;

    var matrix = new THREE.Matrix4();
    matrix.identity();
    matrix.multiply(new THREE.Matrix4().makeTranslation(
      header.ori.x, header.ori.y, header.ori.z
    ));
    ic.mapData.matrixPhi = matrix;
};

iCn3DUI.prototype.loadCubeData = function(data, contour) { var me = this, ic = me.icn3d; "use strict";
    // http://compbio.clemson.edu/downloadDir/delphi/delphi_manual8.pdf
//  2.000000   117 22.724000 42.148000  8.968000 // scale, grid size, center x, y, z
//Gaussian cube format phimap
//    1    -11.859921     24.846119    -37.854994
//  117      0.944863      0.000000      0.000000
//  117      0.000000      0.944863      0.000000
//  117      0.000000      0.000000      0.944863
//    1      0.000000      0.000000      0.000000      0.000000
// -2.89368e+00 -2.91154e+00 -2.92951e+00 -2.94753e+00 -2.96562e+00 -2.98375e+00 // each section contains 117 values, loops z, then y, then x

    var header = {};
    header.filetype = 'cube';

    var lines = data.split('\n');

    var paraArray = [];

/*
    var tmpArray = lines[0].split(/\s+/);
    for(var i = 0; i < tmpArray.length; ++i) {
        var value = parseFloat(tmpArray[i]);
        if(!isNaN(value)) paraArray.push(value);
    }
*/
    paraArray.push(parseFloat( lines[0].substr(0, 10) ) );
    paraArray.push(parseFloat( lines[0].substr(10, 6) ) );
    paraArray.push(parseFloat( lines[0].substr(16, 10) ) );
    paraArray.push(parseFloat( lines[0].substr(26, 10) ) );
    paraArray.push(parseFloat( lines[0].substr(36, 10) ) );

    header.scale = paraArray[0];
    var cx = paraArray[2], cy = paraArray[3], cz = paraArray[4];

    // gridSize
    header.n = paraArray[1];

    header.xExtent = header.yExtent = header.zExtent = header.n;

    var step = 1.0/header.scale;
    var half_size = step * ((header.n - 1) / 2);
    header.ori = new THREE.Vector3(cx - half_size, cy - half_size, cz - half_size);

    var dataPhi = [];
    for(var i = 7, il = lines.length; i < il; ++i) {
        var valueArray = lines[i].split(/\s+/);
        for(var j = 0, jl = valueArray.length; j < jl; ++j) {
            var value = parseFloat(valueArray[j]);
            if(!isNaN(value)) dataPhi.push(value);
        }
    }

    if(dataPhi.length != header.n * header.n * header.n) {
        console.log("the data array size " + dataPhi.length + " didn't match the grid size " + header.n * header.n * header.n + "...");
    }

    ic.mapData.headerPhi = header;
    ic.mapData.dataPhi = dataPhi;
    ic.mapData.contourPhi = contour;

    var matrix = new THREE.Matrix4();
    matrix.identity();
    matrix.multiply(new THREE.Matrix4().makeTranslation(
      header.ori.x, header.ori.y, header.ori.z
    ));
    ic.mapData.matrixPhi = matrix;
};
