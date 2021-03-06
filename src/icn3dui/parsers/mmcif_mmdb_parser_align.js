/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

iCn3DUI.prototype.downloadAlignment = function (align) { var me = this, ic = me.icn3d; "use strict";
    me.opts['proteins'] = 'c alpha trace';
    ic.opts['proteins'] = 'c alpha trace';

    var alignArray = align.split(',');
    //var ids_str = (alignArray.length === 2? 'uids=' : 'ids=') + align;
    var ids_str = 'ids=' + align;

    var url = me.baseUrl + 'vastplus/vastplus.cgi?v=2&cmd=c&b=1&s=1&w3d&' + ids_str;
    var url2 = me.baseUrl + 'vastplus/vastplus.cgi?v=2&cmd=c1&b=1&s=1&d=1&' + ids_str;

    if(me.cfg.inpara !== undefined) {
      url += me.cfg.inpara;
      url2 += me.cfg.inpara;
    }

    ic.bCid = undefined;

    // define for 'align' only
    ic.pdbid_chain2title = {};

    if(me.chainids2resids === undefined) me.chainids2resids = {}; // me.chainids2resids[chainid1][chainid2] = [resid, resid]

    var request = $.ajax({
       url: url2,
       dataType: 'jsonp',
       cache: true
    });

    var seqalign = {};

    var chained = request.then(function( data ) {
        seqalign = data.seqalign;
        if(seqalign === undefined) {
            alert("These two MMDB IDs " + alignArray + " do not have 3D alignment data.");
            return false;
        }

        // set ic.pdbid_molid2chain and ic.chainsColor
        ic.pdbid_molid2chain = {};
        ic.chainsColor = {};
        //me.mmdbidArray = [];
        //for(var i in data) {

        for(var i = 0, il = 2; i < il; ++i) {
            //if(i === 'seqalign') continue;
            var mmdbTmp = data['alignedStructures'][0][i];

            //var pdbid = (data[i].pdbid !== undefined) ? data[i].pdbid : i;
            var pdbid = (mmdbTmp.pdbId !== undefined) ? mmdbTmp.pdbId : mmdbTmp.mmdbId;
            //me.mmdbidArray.push(pdbid); // here two molecules are in alphabatic order, themaster molecule could not be the first one

            var chainNameHash = {}; // chain name may be the same in assembly
            for(var molid in mmdbTmp.molecules) {
              var chainName = mmdbTmp.molecules[molid].chain.trim();
              if(chainNameHash[chainName] === undefined) {
                  chainNameHash[chainName] = 1;
              }
              else {
                  ++chainNameHash[chainName];
              }

              var finalChain = (chainNameHash[chainName] === 1) ? chainName : chainName + chainNameHash[chainName].toString();

              ic.pdbid_molid2chain[pdbid + '_' + molid] = finalChain;

              if(mmdbTmp.molecules[molid].kind === 'p' || mmdbTmp.molecules[molid].kind === 'n') {
                  ic.chainsColor[pdbid + '_' + finalChain] = ic.thr(me.GREY8);
              }
            }
        }

        //var index = 0;
        //for(var mmdbid in data) {
        for(var i = 0, il = 2; i < il; ++i) {
            //if(index < 2) {
                var mmdbTmp = data['alignedStructures'][0][i];

                var pdbid = mmdbTmp.pdbId;

                var molecule = mmdbTmp.molecules;
                for(var molname in molecule) {
                    var chain = molecule[molname].chain;
                    ic.pdbid_chain2title[pdbid + '_' + chain] = molecule[molname].name;
                }
            //}

            //++index;
        }

        // get the color for each aligned chain pair
        me.alignmolid2color = [];
        me.alignmolid2color[0] = {};
        me.alignmolid2color[1] = {};
        var colorLength = ic.stdChainColors.length;

        for(var i = 0, il = seqalign.length; i < il; ++i) {
            var molid1 = seqalign[i][0].moleculeId;
            var molid2 = seqalign[i][1].moleculeId;

            me.alignmolid2color[0][molid1] = (i+1).toString();
            me.alignmolid2color[1][molid2] = (i+1).toString();
        }

        return $.ajax({
          url: url,
          dataType: 'jsonp',
          //jsonp: 'jpf',
          cache: true,
          beforeSend: function() {
              me.showLoading();
          },
          complete: function() {
              //me.hideLoading();
          }
        });
    });

    chained.done(function( data ) { // url
        if (data.atoms !== undefined) {
            me.deferredOpm = $.Deferred(function() {
                //var mmdbidArray = me.inputid.split('_');
                me.mmdbidArray = [];
                for(var i = 0, il = data.alignedStructures[0].length; i < il; ++i) {
                    me.mmdbidArray.push(data.alignedStructures[0][i].pdbId);
                }


                me.setYourNote((me.mmdbidArray[0] + ',' + me.mmdbidArray[1]).toUpperCase() + ' (VAST+) in iCn3D');

                me.loadOpmDataForAlign(data, seqalign, me.mmdbidArray);
            });

            return me.deferredOpm.promise();
        }
        else {
            alert('invalid atoms data.');
            return false;
        }
    });
};

iCn3DUI.prototype.downloadAlignmentPart2 = function (data, seqalign, chainresiCalphaHash2) { var me = this, ic = me.icn3d; "use strict";
    //ic.init();
    me.loadAtomDataIn(data, undefined, 'align', seqalign);

    if(me.cfg.align === undefined && Object.keys(ic.structures).length == 1) {
        $("#" + me.pre + "alternateWrapper").hide();
    }

    // show all
    var allAtoms = {};
    for(var i in ic.atoms) {
        allAtoms[i] = 1;
    }
    ic.dAtoms = allAtoms;
    ic.hAtoms = allAtoms;

    ic.setAtomStyleByOptions(me.opts);
    // change the default color to "Identity"
    ic.setColorByOptions(me.opts, ic.atoms);

    // memebrane is determined by one structure. But transform both structures
    if(chainresiCalphaHash2 !== undefined) me.transformToOpmOriForAlign(me.selectedPdbid, chainresiCalphaHash2, true);

    me.renderStructure();

    if(me.cfg.rotate !== undefined) me.rotStruc(me.cfg.rotate, true);

    me.html2ddgm = '';

    // by default, open the seq alignment window
    //if(me.cfg.show2d !== undefined && me.cfg.show2d) me.openDlg('dl_2ddgm', 'Interactions');
    if(me.cfg.showalignseq) {
        me.openDlg('dl_alignment', 'Select residues in aligned sequences');
    }

    if(me.cfg.show2d && me.bFullUi) {
        me.set2DDiagramsForAlign(me.mmdbidArray[0].toUpperCase(), me.mmdbidArray[1].toUpperCase());
    }

    //if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
};

iCn3DUI.prototype.downloadChainalignmentPart2 = function (data1, data2, chainresiCalphaHash2) { var me = this, ic = me.icn3d; "use strict";
    me.parseMmdbData(data1, 'target');
    me.parseMmdbData(data2, 'query');

    // show all
    var allAtoms = {};
    for(var i in ic.atoms) {
        allAtoms[i] = 1;
    }
    ic.dAtoms = allAtoms;
    ic.hAtoms = allAtoms;

    ic.setAtomStyleByOptions(me.opts);
    // change the6 default color to "Identity"
    ic.setColorByOptions(me.opts, ic.atoms);

    //me.mmdbidArray = Object.keys(ic.structures);

    // memebrane is determined by one structure. But transform both structures
    if(chainresiCalphaHash2 !== undefined) me.transformToOpmOriForAlign(me.selectedPdbid, chainresiCalphaHash2, true);

    me.renderStructure();

    if(me.cfg.rotate !== undefined) me.rotStruc(me.cfg.rotate, true);

    me.html2ddgm = '';

    // by default, open the seq alignment window
    //if(me.cfg.show2d !== undefined && me.cfg.show2d) me.openDlg('dl_2ddgm', 'Interactions');
    if(me.cfg.showalignseq) {
        me.openDlg('dl_alignment', 'Select residues in aligned sequences');
    }

    if(me.cfg.show2d && me.bFullUi) {
        me.openDlg('dl_2ddgm', 'Interactions');
        if(me.bFullUi) {
            if(!ic.bChainAlign) {
                me.download2Ddgm(me.inputid.toUpperCase());
            }
            else {
                me.set2DDiagramsForAlign(me.inputid2.toUpperCase(), me.inputid.toUpperCase());
            }
        }
    }

    //if(me.deferred !== undefined) me.deferred.resolve(); if(me.deferred2 !== undefined) me.deferred2.resolve();
};

iCn3DUI.prototype.downloadChainAlignment = function (chainalign) { var me = this, ic = me.icn3d; "use strict";
    me.opts['proteins'] = 'c alpha trace';
    ic.opts['proteins'] = 'c alpha trace';

    var alignArray = chainalign.split(',');
    var pos1 = alignArray[0].indexOf('_');
    var pos2 = alignArray[1].indexOf('_');
    me.mmdbid_q = alignArray[0].substr(0, pos1).toUpperCase();
    me.mmdbid_t = alignArray[1].substr(0, pos2).toUpperCase();
    me.chain_q = alignArray[0].substr(pos1+1);
    me.chain_t = alignArray[1].substr(pos2+1);

    var chainalignFinal = me.mmdbid_q + "_" + me.chain_q + "," + me.mmdbid_t + "_" + me.chain_t;

    me.setYourNote(chainalign.toUpperCase() + ' in iCn3D');

    var urlalign = me.baseUrl + "vastdyn/vastdyn.cgi?chainpairs=" + chainalignFinal;
    var url_t = me.baseUrl + "mmdb/mmdb_strview.cgi?v=2&program=icn3d&b=1&s=1&ft=1&uid=" + me.mmdbid_t;
    var url_q = me.baseUrl + "mmdb/mmdb_strview.cgi?v=2&program=icn3d&b=1&s=1&ft=1&uid=" + me.mmdbid_q;

    if(me.cfg.inpara !== undefined) {
      url_t += me.cfg.inpara;
      url_q += me.cfg.inpara;
    }

    ic.bCid = undefined;

    // define for 'align' only
    ic.pdbid_chain2title = {};

    if(me.chainids2resids === undefined) me.chainids2resids = {}; // me.chainids2resids[chainid1][chainid2] = [resid, resid]

    $.ajax({
      url: urlalign,
      dataType: 'jsonp',
      cache: true,
      beforeSend: function() {
          me.showLoading();
      },
      complete: function() {
          //me.hideLoading();
      },
      success: function(align) {
        if((align === undefined || align.length == 0) && me.mmdbid_q == me.mmdbid_t && me.chain_q == me.chain_t) {
            me.t_trans_add = {"x":0, "y":0, "z":0};
            me.q_trans_sub = {"x":0, "y":0, "z":0};
            me.q_rotation = {"x1":1, "y1":0, "z1":0, "x2":0, "y2":1, "z2":0, "x3":0, "y3":0, "z3":1};

            //var chainLen = ic.chainsSeq[me.mmdbid_q + '_' + me.chain_q].length;
            //me.qt_start_end =  [{"q_start":1, "q_end": chainLen, "t_start":1, "t_end": chainLen}];
        }
        else if(align === undefined || align.length == 0) {
            if(!me.cfg.command) alert('These two chains ' + chainalign + ' can not align to each other. ' + 'Please select sequences from these two chains in the "Sequences & Annotations" window, ' + 'and click "Realign Selection" in the "File" menu to align your selection.');

            me.cfg.showanno = 1;
            me.cfg.showalignseq = 0;
            //return false;
        }
        else {
            me.t_trans_add = align[0].t_trans_add;
            me.q_trans_sub = align[0].q_trans_sub;
            me.q_rotation = align[0].q_rotation;
            me.qt_start_end = align[0].segs;
        }

        $.ajax({
          url: url_t,
          dataType: 'jsonp',
          cache: true,
          beforeSend: function() {
              me.showLoading();
          },
          complete: function() {
              //me.hideLoading();
          },
          success: function(data1) {
            $.ajax({
              url: url_q,
              dataType: 'jsonp',
              cache: true,
              beforeSend: function() {
                  me.showLoading();
              },
              complete: function() {
                  //me.hideLoading();
              },
              success: function(data2) {
                me.mmdbidArray = [];
                me.mmdbidArray.push(me.mmdbid_q);
                me.mmdbidArray.push(me.mmdbid_t);

                me.loadOpmDataForChainalign(data1, data2, me.mmdbidArray);
              } // success
            }); // ajax
          } // success
        }); // ajax
      }, // success
      error : function(xhr, textStatus, errorThrown ) {
        alert("One of the chains is unavailable in the NCBI MMDB database.");
        return;
      }
    }); // ajax
};

iCn3DUI.prototype.set2DDiagramsForAlign = function (mmdbid1, mmdbid2) { var me = this, ic = me.icn3d; "use strict";
   me.openDlg('dl_2ddgm', 'Interactions');

   mmdbid1 = mmdbid1.substr(0, 4);
   mmdbid2 = mmdbid2.substr(0, 4);

   var url1 = me.baseUrl + "mmdb/mmdb_strview.cgi?v=2&program=icn3d&uid="+mmdbid1+"&intrac=1";
   var url2 = me.baseUrl + "mmdb/mmdb_strview.cgi?v=2&program=icn3d&uid="+mmdbid2+"&intrac=1";

   if(me.cfg.inpara !== undefined) {
      url1 += me.cfg.inpara;
      url2 += me.cfg.inpara;
   }

   var request1 = $.ajax({
        url: url1,
        dataType: 'jsonp',
        cache: true
   });

   var request2 = request1.then(function( data ) {
        me.interactionData1 = data;

        me.html2ddgm = '';

        me.draw2Ddgm(data, mmdbid1, 0);
        if(me.cfg.show2d) me.openDlg('dl_2ddgm', 'Interactions');

        return $.ajax({
          url: url2,
          dataType: 'jsonp',
          cache: true
        });
   });

   request2.done(function( data ) {
        me.interactionData2 = data;

        me.draw2Ddgm(data, mmdbid2, 1);

        me.html2ddgm += "<br>" + me.set2DdgmNote(true);
        $("#" + me.pre + "dl_2ddgm").html(me.html2ddgm);

        me.b2DShown = true;
        //if(me.cfg.show2d !== undefined && me.cfg.show2d) me.openDlg('dl_2ddgm', 'Interactions');

        if(me.deferredViewinteraction !== undefined) me.deferredViewinteraction.resolve();
   });
};

iCn3DUI.prototype.download2Ddgm = function(mmdbid, structureIndex) { var  me = this; "use strict";
/*
  me.deferred3 = $.Deferred(function() {
    var url="https://www.ncbi.nlm.nih.gov/Structure/mmdb/mmdb_strview.cgi?uid="+mmdbid+"&format=json&intrac=3";

   if(me.cfg.inpara !== undefined) {
      url += me.cfg.inpara;
   }

    $.ajax({
        url: url,
        dataType: 'jsonp',
        tryCount : 0,
        retryLimit : 1,
        success: function( data ) {
            me.draw2Ddgm(data, mmdbid, structureIndex);

            if(me.cfg.show2d !== undefined && me.cfg.show2d) me.openDlg('dl_2ddgm', 'Interactions');
            if(me.deferred3 !== undefined) me.deferred3.resolve();
        },
        error : function(xhr, textStatus, errorThrown ) {
            this.tryCount++;
            if (this.tryCount <= this.retryLimit) {
                //try again
                $.ajax(this);
                return;
            }
            return;
        }
    });
  });

  return me.deferred3.promise();
*/

    me.set2DDiagrams(mmdbid);
};

iCn3DUI.prototype.set2DDiagrams = function (mmdbid) { var me = this, ic = me.icn3d; "use strict";
    me.openDlg('dl_2ddgm', 'Interactions');

    if(me.b2DShown === undefined || !me.b2DShown) {
        me.html2ddgm = '';

        me.draw2Ddgm(me.interactionData, mmdbid);

        me.html2ddgm += "<br>" + me.set2DdgmNote();
        $("#" + me.pre + "dl_2ddgm").html(me.html2ddgm);
    }

    me.b2DShown = true;
};

iCn3DUI.prototype.setSeqAlign = function (seqalign, alignedStructures) { var me = this, ic = me.icn3d; "use strict";
      //loadSeqAlignment
      var alignedAtoms = {};
      var mmdbid1 = alignedStructures[0][0].pdbId;
      var mmdbid2 = alignedStructures[0][1].pdbId;

      me.conservedName1 = mmdbid1 + '_cons';
      me.nonConservedName1 = mmdbid1 + '_ncons';
      me.notAlignedName1 = mmdbid1 + '_nalign';

      me.conservedName2 = mmdbid2 + '_cons';
      me.nonConservedName2 = mmdbid2 + '_ncons';
      me.notAlignedName2 = mmdbid2 + '_nalign';

      me.consHash1 = {};
      me.nconsHash1 = {};
      me.nalignHash1 = {};

      me.consHash2 = {};
      me.nconsHash2 = {};
      me.nalignHash2 = {};

      for (var i = 0, il = seqalign.length; i < il; ++i) {
          // first sequence
          var alignData = seqalign[i][0];
          var molid1 = alignData.moleculeId;

          var chain1 = ic.pdbid_molid2chain[mmdbid1 + '_' + molid1];
          var chainid1 = mmdbid1 + '_' + chain1;

          var id2aligninfo = {};
          var start = alignData.sequence.length, end = -1;
          var bStart = false;
          for(var j = 0, jl = alignData.sequence.length; j < jl; ++j) {
              // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
              //var resi = alignData.sequence[j][1];
              var resi = alignData.sequence[j][0];
              var resn = (alignData.sequence[j][2] === '~') ? '-' : alignData.sequence[j][2];
              //resn = resn.toUpperCase();

              var aligned = (alignData.sequence[j][3]) ? 1 : 0; // alignData.sequence[j][3]: 0, false, 1, true

              if(aligned == 1) {
                  if(j < start && !bStart) {
                      start = j;
                      bStart = true; // set start just once
                  }
                  if(j > end) end = j;
              }

              id2aligninfo[j] = {"resi": resi, "resn": resn, "aligned": aligned};
          }

          // second sequence
          alignData = seqalign[i][1];
          var molid2 = alignData.moleculeId;

          var chain2 = ic.pdbid_molid2chain[mmdbid2 + '_' + molid2];
          var chainid2 = mmdbid2 + '_' + chain2;

          // annoation title for the master seq only
          if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];
          if(ic.alnChainsAnTtl[chainid1][0] === undefined ) ic.alnChainsAnTtl[chainid1][0] = [];
          if(ic.alnChainsAnTtl[chainid1][1] === undefined ) ic.alnChainsAnTtl[chainid1][1] = [];
          if(ic.alnChainsAnTtl[chainid1][2] === undefined ) ic.alnChainsAnTtl[chainid1][2] = [];
          if(ic.alnChainsAnTtl[chainid1][3] === undefined ) ic.alnChainsAnTtl[chainid1][3] = [];
          if(ic.alnChainsAnTtl[chainid1][4] === undefined ) ic.alnChainsAnTtl[chainid1][4] = [];
          if(ic.alnChainsAnTtl[chainid1][5] === undefined ) ic.alnChainsAnTtl[chainid1][5] = [];
          if(ic.alnChainsAnTtl[chainid1][6] === undefined ) ic.alnChainsAnTtl[chainid1][6] = [];

          // two annotations without titles
          ic.alnChainsAnTtl[chainid1][0].push(chainid2);
          ic.alnChainsAnTtl[chainid1][1].push(chainid1);
          ic.alnChainsAnTtl[chainid1][2].push("");
          ic.alnChainsAnTtl[chainid1][3].push("");

          // 2nd chain title
          ic.alnChainsAnTtl[chainid1][4].push(chainid2);
          // master chain title
          ic.alnChainsAnTtl[chainid1][5].push(chainid1);
          // empty line
          ic.alnChainsAnTtl[chainid1][6].push("");

          var alignIndex = 1;
          //for(var j = 0, jl = alignData.sseq.length; j < jl; ++j) {
          for(var j = start; j <= end; ++j) {
              // 0: internal resi id, 1: pdb resi id, 2: resn, 3: aligned or not
              //var resi = alignData.sequence[j][1];
              var resi = alignData.sequence[j][0];
              var resn = (alignData.sequence[j][2] === '~') ? '-' : alignData.sequence[j][2];
              //resn = resn.toUpperCase();

              var alignedTmp = (alignData.sequence[j][3]) ? 1 : 0; // alignData.sequence[j][3]: 0, false, 1, true

              var aligned = id2aligninfo[j].aligned + alignedTmp; // 0 or 2

              var color, color2, classname;
              if(aligned === 2) { // aligned
                  if(id2aligninfo[j].resn === resn) {
                      color = '#FF0000';
                      classname = 'icn3d-cons';

                      me.consHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                      me.consHash2[chainid2 + '_' + resi] = 1;
                  }
                  else {
                      color = '#0000FF';
                      classname = 'icn3d-ncons';

                      me.nconsHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                      me.nconsHash2[chainid2 + '_' + resi] = 1;
                  }

                  color2 = '#' + me.getColorhexFromBlosum62(id2aligninfo[j].resn, resn);

                  // expensive and thus remove
                  //alignedAtoms = ic.unionHash(alignedAtoms, ic.residues[chainid1 + '_' + id2aligninfo[j].resi]);
                  //alignedAtoms = ic.unionHash(alignedAtoms, ic.residues[chainid2 + '_' + resi]);
              }
              else {
                  color = me.GREY8;
                  classname = 'icn3d-nalign';

                  me.nalignHash1[chainid1 + '_' + id2aligninfo[j].resi] = 1;
                  me.nalignHash2[chainid2 + '_' + resi] = 1;
              }

              // chain1
              if(ic.alnChainsSeq[chainid1] === undefined) ic.alnChainsSeq[chainid1] = [];

              var resObject = {};
              resObject.mmdbid = mmdbid1;
              resObject.chain = chain1;
              resObject.resi = id2aligninfo[j].resi;
              // resi will be empty if there is no coordinates
              resObject.resn = (resObject.resi === '' || classname === 'icn3d-nalign') ? id2aligninfo[j].resn.toLowerCase() : id2aligninfo[j].resn;
              resObject.aligned = aligned;
              // resi will be empty if there is no coordinates
              resObject.color = (resObject.resi === '') ? me.GREYC : color; // color by identity
              resObject.color2 = (resObject.resi === '') ? me.GREYC : color2; // color by conservation
              resObject.class = classname;

              ic.alnChainsSeq[chainid1].push(resObject);

              if(id2aligninfo[j].resi !== '') {
                  if(ic.alnChains[chainid1] === undefined) ic.alnChains[chainid1] = {};
                  $.extend(ic.alnChains[chainid1], ic.residues[chainid1 + '_' + id2aligninfo[j].resi] );
              }

              // chain2
              if(ic.alnChainsSeq[chainid2] === undefined) ic.alnChainsSeq[chainid2] = [];

              resObject = {};
              resObject.mmdbid = mmdbid2;
              resObject.chain = chain2;
              resObject.resi = resi;
              // resi will be empty if there is no coordinates
              resObject.resn = (resObject.resi === '' || classname === 'icn3d-nalign') ? resn.toLowerCase() : resn;
              resObject.aligned = aligned;
              // resi will be empty if there is no coordinates
              resObject.color = (resObject.resi === '') ? me.GREYC : color; // color by identity
              resObject.color2 = (resObject.resi === '') ? me.GREYC : color2; // color by conservation
              resObject.class = classname;

              ic.alnChainsSeq[chainid2].push(resObject);

              if(resObject.resi !== '') {
                  if(ic.alnChains[chainid2] === undefined) ic.alnChains[chainid2] = {};
                  $.extend(ic.alnChains[chainid2], ic.residues[chainid2 + '_' + resi] );
              }

              // annotation is for the master seq only
              if(ic.alnChainsAnno[chainid1] === undefined ) ic.alnChainsAnno[chainid1] = [];
              if(ic.alnChainsAnno[chainid1][0] === undefined ) ic.alnChainsAnno[chainid1][0] = [];
              if(ic.alnChainsAnno[chainid1][1] === undefined ) ic.alnChainsAnno[chainid1][1] = [];
              if(ic.alnChainsAnno[chainid1][2] === undefined ) ic.alnChainsAnno[chainid1][2] = [];
              if(ic.alnChainsAnno[chainid1][3] === undefined ) ic.alnChainsAnno[chainid1][3] = [];
              if(j === start) {
                  // empty line
                  // 2nd chain title
                  if(ic.alnChainsAnno[chainid1][4] === undefined ) ic.alnChainsAnno[chainid1][4] = [];
                  // master chain title
                  if(ic.alnChainsAnno[chainid1][5] === undefined ) ic.alnChainsAnno[chainid1][5] = [];
                  // empty line
                  if(ic.alnChainsAnno[chainid1][6] === undefined ) ic.alnChainsAnno[chainid1][6] = [];

                  ic.alnChainsAnno[chainid1][4].push(ic.pdbid_chain2title[chainid2]);
                  ic.alnChainsAnno[chainid1][5].push(ic.pdbid_chain2title[chainid1]);
                  ic.alnChainsAnno[chainid1][6].push('');
              }

              var residueid1 = chainid1 + '_' + id2aligninfo[j].resi;
              var residueid2 = chainid2 + '_' + resi;
              var ss1 = ic.secondaries[residueid1];
              var ss2 = ic.secondaries[residueid2];
              if(ss2 !== undefined) {
                  ic.alnChainsAnno[chainid1][0].push(ss2);
              }
              else {
                  ic.alnChainsAnno[chainid1][0].push('-');
              }

              if(ss1 !== undefined) {
                  ic.alnChainsAnno[chainid1][1].push(ss1);
              }
              else {
                  ic.alnChainsAnno[chainid1][1].push('-');
              }

              var symbol = '.';
              if(alignIndex % 5 === 0) symbol = '*';
              if(alignIndex % 10 === 0) symbol = '|';
              ic.alnChainsAnno[chainid1][2].push(symbol); // symbol: | for 10th, * for 5th, . for rest

              var numberStr = '';
              if(alignIndex % 10 === 0) numberStr = alignIndex.toString();
              ic.alnChainsAnno[chainid1][3].push(numberStr); // symbol: 10, 20, etc, empty for rest

              ++alignIndex;
          } // end for(var j
      } // end for(var i

      seqalign = {};
};

iCn3DUI.prototype.setSeqPerResi = function (chainid, chainid1, chainid2, resi, resn, bAligned, color, color2, classname, bFirstChain, bFirstResi, alignIndex) { var me = this, ic = me.icn3d; "use strict";
      if(ic.alnChainsSeq[chainid] === undefined) ic.alnChainsSeq[chainid] = [];

      var resObject = {};
      var pos = chainid.indexOf('_');
      resObject.mmdbid = chainid.substr(0, pos);
      resObject.chain = chainid.substr(pos+1);
      resObject.resi = resi;
      // resi will be empty if there is no coordinates
      resObject.resn = (resObject.resi === '' || classname === 'icn3d-nalign') ? resn.toLowerCase() : resn;
      resObject.aligned = bAligned;
      // resi will be empty if there is no coordinates
      resObject.color = (resObject.resi === '') ? me.GREYC : color; // color by identity
      resObject.color2 = (resObject.resi === '') ? me.GREYC : color2; // color by conservation
      resObject.class = classname;

      ic.alnChainsSeq[chainid].push(resObject);

      if(resObject.resi !== '') {
          if(ic.alnChains[chainid] === undefined) ic.alnChains[chainid] = {};
          $.extend(ic.alnChains[chainid], ic.residues[chainid + '_' + resObject.resi] );
      }

      if(bFirstChain) {
          // annotation is for the master seq only
          if(ic.alnChainsAnno[chainid] === undefined ) ic.alnChainsAnno[chainid] = [];
          if(ic.alnChainsAnno[chainid][0] === undefined ) ic.alnChainsAnno[chainid][0] = [];
          if(ic.alnChainsAnno[chainid][1] === undefined ) ic.alnChainsAnno[chainid][1] = [];
          if(ic.alnChainsAnno[chainid][2] === undefined ) ic.alnChainsAnno[chainid][2] = [];
          if(ic.alnChainsAnno[chainid][3] === undefined ) ic.alnChainsAnno[chainid][3] = [];
          if(bFirstResi) {
              // empty line
              // 2nd chain title
              if(ic.alnChainsAnno[chainid][4] === undefined ) ic.alnChainsAnno[chainid][4] = [];
              // master chain title
              if(ic.alnChainsAnno[chainid][5] === undefined ) ic.alnChainsAnno[chainid][5] = [];
              // empty line
              if(ic.alnChainsAnno[chainid][6] === undefined ) ic.alnChainsAnno[chainid][6] = [];

              var title1 = ic.pdbid_chain2title && ic.pdbid_chain2title.hasOwnProperty(chainid2) ? ic.pdbid_chain2title[chainid2] : ""
              var title2 = ic.pdbid_chain2title && ic.pdbid_chain2title.hasOwnProperty(chainid) ? ic.pdbid_chain2title[chainid] : ""
              ic.alnChainsAnno[chainid][4].push(title1);
              ic.alnChainsAnno[chainid][5].push(title2);
              ic.alnChainsAnno[chainid][6].push('');
          }

          var symbol = '.';
          if(alignIndex % 5 === 0) symbol = '*';
          if(alignIndex % 10 === 0) symbol = '|';
          ic.alnChainsAnno[chainid][2].push(symbol); // symbol: | for 10th, * for 5th, . for rest

          var numberStr = '';
          if(alignIndex % 10 === 0) numberStr = alignIndex.toString();
          ic.alnChainsAnno[chainid][3].push(numberStr); // symbol: 10, 20, etc, empty for rest

          var residueid = chainid + '_' + resi;
          var ss = ic.secondaries[residueid];

          if(ss !== undefined) {
              ic.alnChainsAnno[chainid][1].push(ss);
          }
          else {
              ic.alnChainsAnno[chainid][1].push('-');
          }
      }
      else {
          var residueid = chainid + '_' + resi;
          var ss = ic.secondaries[residueid];

          if(ic.alnChainsAnno.hasOwnProperty(chainid1) && ic.alnChainsAnno[chainid1].length > 0) {
              if(ss !== undefined) {
                  ic.alnChainsAnno[chainid1][0].push(ss);
              }
              else {
                  ic.alnChainsAnno[chainid1][0].push('-');
              }
          }
          else {
              console.log("Error: ic.alnChainsAnno[chainid1] is undefined");
          }
      }
};

iCn3DUI.prototype.setSeqAlignChain = function () { var me = this, ic = me.icn3d; "use strict";
      //loadSeqAlignment
      var alignedAtoms = {};
      var mmdbid1 = me.inputid2;
      var mmdbid2 = me.inputid;

      var chainidArray = me.cfg.chainalign.split(',');
      var pos1 = chainidArray[0].indexOf('_');
      var pos2 = chainidArray[1].indexOf('_');

      var chain1 = chainidArray[0].substr(pos1 + 1);
      var chain2 = chainidArray[1].substr(pos2 + 1);

      if(mmdbid1 == mmdbid2 && chain1 == chain2) {
        var chainLen = ic.chainsSeq[me.mmdbid_q + '_' + me.chain_q].length;
        me.qt_start_end =  [{"q_start":1, "q_end": chainLen, "t_start":1, "t_end": chainLen}];
      }

      var chainid1 = chainidArray[0].substr(0, pos1).toUpperCase() + "_" + chain1;
      var chainid2 = chainidArray[1].substr(0, pos2).toUpperCase() + "_" + chain2;

      if(me.mmdbid_q !== undefined && me.mmdbid_q === me.mmdbid_t) {
          //chainid1 += me.postfix;
          chainid1 = chainidArray[0].substr(0, pos1).toUpperCase() + me.postfix + "_" + chain1;
      }

      me.conservedName1 = chainid1 + '_cons';
      me.nonConservedName1 = chainid1 + '_ncons';
      me.notAlignedName1 = chainid1 + '_nalign';

      me.conservedName2 = chainid2 + '_cons';
      me.nonConservedName2 = chainid2 + '_ncons';
      me.notAlignedName2 = chainid2 + '_nalign';

      me.consHash1 = {};
      me.nconsHash1 = {};
      me.nalignHash1 = {};

      me.consHash2 = {};
      me.nconsHash2 = {};
      me.nalignHash2 = {};

      // annoation title for the master seq only
      if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];
      for(var i = 0; i < 7; ++i) {
          if(ic.alnChainsAnTtl[chainid1][i] === undefined ) ic.alnChainsAnTtl[chainid1][i] = [];
      }

      // two annotations without titles
      ic.alnChainsAnTtl[chainid1][0].push(chainid2);
      ic.alnChainsAnTtl[chainid1][1].push(chainid1);
      ic.alnChainsAnTtl[chainid1][2].push("");
      ic.alnChainsAnTtl[chainid1][3].push("");

      // 2nd chain title
      ic.alnChainsAnTtl[chainid1][4].push(chainid2);
      // master chain title
      ic.alnChainsAnTtl[chainid1][5].push(chainid1);
      // empty line
      ic.alnChainsAnTtl[chainid1][6].push("");

      var color, color2, classname;
      var firstIndex1 = 0;
      var firstIndex2 = 0;
      var prevIndex1, prevIndex2;

      var alignIndex = 1;
      for (var i = 0, il = me.qt_start_end.length; i < il; ++i) {
          var start1 = me.qt_start_end[i].q_start - 1;
          var start2 = me.qt_start_end[i].t_start - 1;
          var end1 = me.qt_start_end[i].q_end - 1;
          var end2 = me.qt_start_end[i].t_end - 1;

          if(i > 0) {
              var index1 = alignIndex;
              for(var j = prevIndex1 + 1, jl = start1; j < jl; ++j) {
                  if(ic.chainsSeq[chainid1] === undefined) break;
                  var resi = ic.chainsSeq[chainid1][j].resi;
                  var resn = ic.chainsSeq[chainid1][j].name.toLowerCase();

                  color = me.GREY8;
                  classname = 'icn3d-nalign';

                  me.nalignHash1[chainid1 + '_' + resi] = 1;
                  me.setSeqPerResi(chainid1, chainid1, chainid2, resi, resn, false, color, undefined, classname, true, false, index1);
                  ++index1;
              }

              var index2 = alignIndex;
              for(var j = prevIndex2 + 1, jl = start2; j < jl; ++j) {
                  if(ic.chainsSeq[chainid2] === undefined) break;
                  var resi = ic.chainsSeq[chainid2][j].resi;
                  var resn = ic.chainsSeq[chainid2][j].name.toLowerCase();

                  color = me.GREY8;
                  classname = 'icn3d-nalign';

                  me.nalignHash2[chainid2 + '_' + resi] = 1;
                  me.setSeqPerResi(chainid2, chainid1, chainid2, resi, resn, false, color, undefined, classname, false, false, index2);
                  ++index2; // count just once
              }

              if(index1 < index2) {
                  alignIndex = index2;

                  for(var j = 0; j < index2 - index1; ++j) {
                      var resi = '';
                      var resn = '-';

                      color = me.GREY8;
                      classname = 'icn3d-nalign';

                      me.setSeqPerResi(chainid1, chainid1, chainid2, resi, resn, false, color, undefined, classname, true, false, index1 + j);
                  }
              }
              else {
                  alignIndex = index1;

                  for(var j = 0; j < index1 - index2; ++j) {
                      var resi = '';
                      var resn = '-';

                      color = me.GREY8;
                      classname = 'icn3d-nalign';

                      me.setSeqPerResi(chainid2, chainid1, chainid2, resi, resn, false, color, undefined, classname, false, false, index2 + j);
                  }
              }
          }

          for(var j = 0; j <= end1 - start1; ++j) {
              if(ic.chainsSeq[chainid1] === undefined || ic.chainsSeq[chainid2] === undefined) break;

              var resi1 = ic.chainsSeq[chainid1][j + start1].resi;
              var resi2 = ic.chainsSeq[chainid2][j + start2].resi;
              var resn1 = ic.chainsSeq[chainid1][j + start1].name.toUpperCase();
              var resn2 = ic.chainsSeq[chainid2][j + start2].name.toUpperCase();

              if(resn1 === resn2) {
                  color = '#FF0000';
                  classname = 'icn3d-cons';

                  me.consHash1[chainid1 + '_' + resi1] = 1;
                  me.consHash2[chainid2 + '_' + resi2] = 1;
              }
              else {
                  color = '#0000FF';
                  classname = 'icn3d-ncons';

                  me.nconsHash1[chainid1 + '_' + resi1] = 1;
                  me.nconsHash2[chainid2 + '_' + resi2] = 1;
              }

              color2 = '#' + me.getColorhexFromBlosum62(resn1, resn2);

              var bFirstResi = (i === 0 && j === 0) ? true : false;
              me.setSeqPerResi(chainid1, chainid1, chainid2, resi1, resn1, true, color, color2, classname, true, bFirstResi, alignIndex);
              me.setSeqPerResi(chainid2, chainid1, chainid2, resi2, resn2, true, color, color2, classname, false, bFirstResi, alignIndex);

              ++alignIndex;
          } // end for(var j

          prevIndex1 = end1;
          prevIndex2 = end2;
      } // end for(var i
};

iCn3DUI.prototype.setSeqAlignForRealign = function () { var me = this, ic = me.icn3d; "use strict";
      //loadSeqAlignment
      var alignedAtoms = {};
      var structureArray = Object.keys(ic.structures);
      var structure1 = structureArray[0];
      var structure2 = structureArray[1];

      me.conservedName1 = structure1 + '_cons';
      me.conservedName2 = structure2 + '_cons';

      me.consHash1 = {};
      me.consHash2 = {};

      ic.alnChainsAnTtl = {};
      ic.alnChainsAnno = {};

      ic.alnChainsSeq = {};
      ic.alnChains = {};

//      var emptyResObject = {resid: '', resn:'', resi: 0, aligned: false};

//      var prevChainid1 = '', prevChainid2 = '', cnt1 = 0, cnt2 = 0;

      ic.alnChainsSeq = {};

      var residuesHash = {};

      for(var i = 0, il = me.realignResid[structure1].length; i < il; ++i) {
          var resObject1 = me.realignResid[structure1][i];
          var pos1 = resObject1.resid.lastIndexOf('_');
          var chainid1 = resObject1.resid.substr(0, pos1);
          var resi1 = resObject1.resid.substr(pos1 + 1);
          resObject1.resi = resi1;
          resObject1.aligned = true;

          var resObject2 = me.realignResid[structure2][i];
          var pos2 = resObject2.resid.lastIndexOf('_');
          var chainid2 = resObject2.resid.substr(0, pos2);
          var resi2 = resObject2.resid.substr(pos2 + 1);
          resObject2.resi = resi2;
          resObject2.aligned = true;

          residuesHash[resObject1.resid] = 1;
          residuesHash[resObject2.resid] = 1;

          var color;
          if(resObject1.resn == resObject2.resn) {
              color = "#FF0000";
          }
          else {
              color = "#0000FF";
          }
          var color2 = '#' + me.getColorhexFromBlosum62(resObject1.resn, resObject2.resn);

          resObject1.color = color;
          resObject2.color = color;

          resObject1.color2 = color2;
          resObject2.color2 = color2;

          for(var j in ic.residues[resObject1.resid]) {
              ic.atoms[j].color = ic.thr(color);
          }
          for(var j in ic.residues[resObject2.resid]) {
              ic.atoms[j].color = ic.thr(color);
          }

          // annoation title for the master seq only
          if(ic.alnChainsAnTtl[chainid1] === undefined ) ic.alnChainsAnTtl[chainid1] = [];

          for(var j = 0; j < 3; ++j) {
              if(ic.alnChainsAnTtl[chainid1][j] === undefined ) ic.alnChainsAnTtl[chainid1][j] = [];
          }

          // two annotations without titles
          for(var j = 0; j < 3; ++j) {
              ic.alnChainsAnTtl[chainid1][j].push("");
          }

          if(ic.alnChainsSeq[chainid1] === undefined) ic.alnChainsSeq[chainid1] = [];
          if(ic.alnChainsSeq[chainid2] === undefined) ic.alnChainsSeq[chainid2] = [];

          ic.alnChainsSeq[chainid1].push(resObject1);
          ic.alnChainsSeq[chainid2].push(resObject2);

          if(ic.alnChains[chainid1] === undefined) ic.alnChains[chainid1] = {};
          if(ic.alnChains[chainid2] === undefined) ic.alnChains[chainid2] = {};
          $.extend(ic.alnChains[chainid1], ic.residues[chainid1 + '_' + resObject1.resi] );
          $.extend(ic.alnChains[chainid2], ic.residues[chainid2 + '_' + resObject2.resi] );

          me.consHash1[chainid1 + '_' + resObject1.resi] = 1;
          me.consHash2[chainid2 + '_' + resObject2.resi] = 1;

          // annotation is for the master seq only
          if(ic.alnChainsAnno[chainid1] === undefined ) ic.alnChainsAnno[chainid1] = [];
          //if(ic.alnChainsAnno[chainid2] === undefined ) ic.alnChainsAnno[chainid2] = [];

          for(var j = 0; j < 3; ++j) {
              if(ic.alnChainsAnno[chainid1][j] === undefined ) ic.alnChainsAnno[chainid1][j] = [];
          }

          var symbol = '.';
          if(i % 5 === 0) symbol = '*';
          if(i % 10 === 0) symbol = '|';
          ic.alnChainsAnno[chainid1][0].push(symbol); // symbol: | for 10th, * for 5th, . for rest

          var numberStr = '';
          if(i % 10 === 0) numberStr = i.toString();
          ic.alnChainsAnno[chainid1][1].push(numberStr); // symbol: 10, 20, etc, empty for rest
      }

        var commandname = 'protein_aligned';
        var commanddescr = 'protein aligned';
        var select = "select " + me.residueids2spec(Object.keys(residuesHash));

        me.addCustomSelection(Object.keys(residuesHash), commandname, commanddescr, select, true);
};

iCn3DUI.prototype.realignOnSeqAlign = function () { var me = this, ic = me.icn3d; "use strict";
    me.saveSelectionPrep();

    var index = Object.keys(ic.defNames2Atoms).length;
    var name = 'alseq_' + index;

    me.saveSelection(name, name);

    var struct2SeqHash = {};
    var struct2CoorHash = {};
    var struct2resid = {};
    var lastStruResi = '';
    for(var serial in ic.hAtoms) {
        var atom = ic.atoms[serial];
        if( (ic.proteins.hasOwnProperty(serial) && atom.name == "CA")
          || (ic.nucleotides.hasOwnProperty(serial) && (atom.name == "O3'" || atom.name == "O3*")) ) {
            var resid = atom.structure + '_' + atom.chain + '_' + atom.resi;

            if(resid == lastStruResi) continue; // e.g., Alt A and B

            if(!struct2SeqHash.hasOwnProperty(atom.structure)) {
                struct2SeqHash[atom.structure] = '';
                struct2CoorHash[atom.structure] = [];
                struct2resid[atom.structure] = [];
            }

            var oneLetterRes = ic.residueName2Abbr(atom.resn.substr(0, 3)).substr(0, 1);

            struct2SeqHash[atom.structure] += oneLetterRes;
            struct2CoorHash[atom.structure].push(atom.coord.clone());
            struct2resid[atom.structure].push(resid);

            //if(me.realignResid[atom.structure] === undefined) me.realignResid[atom.structure] = [];
            //me.realignResid[atom.structure].push(resid);

            lastStruResi = resid;
        }
    }

    var structArray = Object.keys(struct2SeqHash);

    var toStruct = structArray[0];
    var fromStruct = structArray[1];

    var seq1 = struct2SeqHash[toStruct];
    var seq2 = struct2SeqHash[fromStruct];

    var coord1 = struct2CoorHash[toStruct];
    var coord2 = struct2CoorHash[fromStruct];

    var residArray1 = struct2resid[toStruct];
    var residArray2 = struct2resid[fromStruct];

   var url = 'https://www.ncbi.nlm.nih.gov/Structure/pwaln/pwaln.fcgi?from=track';
   $.ajax({
      url: url,
      type: 'POST',
      data : {'targets': seq1, 'queries': seq2},
      dataType: 'jsonp',
      //dataType: 'json',
      tryCount : 0,
      retryLimit : 1,
      success: function(data) {
          var query, target;

          if(data.data !== undefined) {
              query = data.data[0].query;
              var targetName = Object.keys(data.data[0].targets)[0];
              target = data.data[0].targets[targetName];

              target = target.hsps[0];
          }

          if(query !== undefined && target !== undefined) {
              // transform from the second structure to the first structure
              var coordsTo = [];
              var coordsFrom = [];

              var seqto = '', seqfrom = ''

              me.realignResid = {};
              me.realignResid[toStruct] = [];
              me.realignResid[fromStruct] = [];

              var segArray = target.segs;
              for(var i = 0, il = segArray.length; i < il; ++i) {
                  var seg = segArray[i];
                  var prevChain1 = '', prevChain2 = '';
                  for(var j = 0; j <= seg.orito - seg.orifrom; ++j) {
                      var chainid1 = residArray1[j + seg.orifrom].substr(0, residArray1[j + seg.orifrom].lastIndexOf('_'));
                      var chainid2 = residArray2[j + seg.from].substr(0, residArray2[j + seg.from].lastIndexOf('_'));

                      coordsTo.push(coord1[j + seg.orifrom]);
                      coordsFrom.push(coord2[j + seg.from]);

                      seqto += seq1[j + seg.orifrom];
                      seqfrom += seq2[j + seg.from];

                      // one chaincould be longer than the other
                      if(j == 0 || (prevChain1 == chainid1 && prevChain2 == chainid2) || (prevChain1 != chainid1 && prevChain2 != chainid2)) {
                          me.realignResid[toStruct].push({'resid':residArray1[j + seg.orifrom], 'resn':seq1[j + seg.orifrom]});
                          me.realignResid[fromStruct].push({'resid':residArray2[j + seg.from], 'resn':seq2[j + seg.from]});
                      }

                      prevChain1 = chainid1;
                      prevChain2 = chainid2;
                  }
              }

              me.alignCoords(coordsFrom, coordsTo, fromStruct);

              me.updateHlAll();
          }
          else {
              if(fromStruct === undefined && !me.cfg.command) {
                 alert('Please do not align residues in the same structure');
              }
              else if((seq1.length < 6 || seq2.length < 6) && !me.cfg.command) {
                 alert('These sequences are too short for alignment');
              }
              else if(seq1.length >= 6 && seq2.length >= 6 && !me.cfg.command) {
                 alert('These sequences can not be aligned to each other');
              }
          }

          if(me.deferredRealign !== undefined) me.deferredRealign.resolve();
      },
      error : function(xhr, textStatus, errorThrown ) {
        this.tryCount++;
        if (this.tryCount <= this.retryLimit) {
            //try again
            $.ajax(this);
            return;
        }

           if(fromStruct === undefined && !me.cfg.command) {
              alert('Please do not align residues in the same structure');
           }
           else if((seq1.length < 6 || seq2.length < 6) && !me.cfg.command) {
              alert('These sequences are too short for alignment');
           }
           else if(seq1.length >= 6 && seq2.length >= 6 && !me.cfg.command) {
              alert('These sequences can not be aligned to each other');
           }

        if(me.deferredRealign !== undefined) me.deferredRealign.resolve();
      }
    });

};

iCn3DUI.prototype.realign = function() { var me = this, ic = me.icn3d; "use strict";
    me.saveSelectionPrep();

    var index = Object.keys(ic.defNames2Atoms).length;
    var name = 'alseq_' + index;

    me.saveSelection(name, name);

    var structHash = {};
    me.realignResid = {};
    var lastStruResi = '';
    for(var serial in ic.hAtoms) {
        var atom = ic.atoms[serial];
        if( (ic.proteins.hasOwnProperty(serial) && atom.name == "CA")
          || (ic.nucleotides.hasOwnProperty(serial) && (atom.name == "O3'" || atom.name == "O3*")) ) {
            if(atom.structure + '_' + atom.resi == lastStruResi) continue; // e.g., Alt A and B

            if(!structHash.hasOwnProperty(atom.structure)) {
                structHash[atom.structure] = [];
            }
            structHash[atom.structure].push(atom.coord.clone());

            if(!me.realignResid.hasOwnProperty(atom.structure)) {
                me.realignResid[atom.structure] = [];
            }

            me.realignResid[atom.structure].push({'resid': atom.structure + '_' + atom.chain + '_' + atom.resi, 'resn': ic.residueName2Abbr(atom.resn.substr(0, 3)).substr(0, 1)});

            lastStruResi = atom.structure + '_' + atom.resi;
        }
    }

    var structArray = Object.keys(structHash);

    var toStruct = structArray[0];
    var fromStruct = structArray[1];

    // transform from the second structure to the first structure
    var coordsFrom = structHash[fromStruct];
    var coordsTo = structHash[toStruct];

    var bKeepSeq = true;
    me.alignCoords(coordsFrom, coordsTo, fromStruct, bKeepSeq);

    me.updateHlAll();
};
