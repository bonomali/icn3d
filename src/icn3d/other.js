/**
 * @author Jiyao Wang <wangjiy@ncbi.nlm.nih.gov> / https://github.com/ncbi/icn3d
 */

iCn3D.prototype.cloneHash = function(from) {
  var to = {};
  for(var i in from) {
    to[i] = from[i];
  }

  return to;
};

iCn3D.prototype.residueName2Abbr = function(residueName) {
  if(residueName !== undefined && residueName.charAt(0) !== ' ' && residueName.charAt(1) === ' ') {
    //residueName = 'n' + residueName.charAt(0);
    residueName = residueName.charAt(0);
  }

  switch(residueName) {
    case '  A':
      return 'A';
      break;
    case '  C':
      return 'C';
      break;
    case '  G':
      return 'G';
      break;
    case '  T':
      return 'T';
      break;
    case '  U':
      return 'U';
      break;
    case '  I':
      return 'I';
      break;
    case ' DA':
      return 'A';
      break;
    case ' DC':
      return 'C';
      break;
    case ' DG':
      return 'G';
      break;
    case ' DT':
      return 'T';
      break;
    case ' DU':
      return 'U';
      break;
    case ' DI':
      return 'I';
      break;
    case 'ALA':
      return 'A';
      break;
    case 'ARG':
      return 'R';
      break;
    case 'ASN':
      return 'N';
      break;
    case 'ASP':
      return 'D';
      break;
    case 'CYS':
      return 'C';
      break;
    case 'GLU':
      return 'E';
      break;
    case 'GLN':
      return 'Q';
      break;
    case 'GLY':
      return 'G';
      break;
    case 'HIS':
      return 'H';
      break;
    case 'ILE':
      return 'I';
      break;
    case 'LEU':
      return 'L';
      break;
    case 'LYS':
      return 'K';
      break;
    case 'MET':
      return 'M';
      break;
    case 'PHE':
      return 'F';
      break;
    case 'PRO':
      return 'P';
      break;
    case 'SER':
      return 'S';
      break;
    case 'THR':
      return 'T';
      break;
    case 'TRP':
      return 'W';
      break;
    case 'TYR':
      return 'Y';
      break;
    case 'VAL':
      return 'V';
      break;
    case 'SEC':
      return 'U';
      break;
//        case 'PYL':
//          return 'O';
//          break;

    case 'HOH':
      return 'O';
      break;
    case 'WAT':
      return 'O';
      break;

    default:
      return residueName;
  }
};

iCn3D.prototype.intHash = function(atoms1, atoms2) {
    var results = {};

    if(Object.keys(atoms1).length < Object.keys(atoms2).length) {
        for (var i in atoms1) {
            if (atoms2 !== undefined && atoms2[i]) {
                results[i] = atoms1[i];
            }
        }
    }
    else {
        for (var i in atoms2) {
            if (atoms1 !== undefined && atoms1[i]) {
                results[i] = atoms2[i];
            }
        }
    }

    atoms1 = {};
    atoms2 = {};

    return results;
};

// get atoms in allAtoms, but not in "atoms"
iCn3D.prototype.exclHash = function(includeAtoms, excludeAtoms) {
    var results = {};

    for (var i in includeAtoms) {
        if (!(i in excludeAtoms)) {
            results[i] = includeAtoms[i];
        }
    }

    includeAtoms = {};
    excludeAtoms = {};

    return results;
};

iCn3D.prototype.unionHash = function(atoms1, atoms2) {
    // The commented-out version has a problem: atom1 became undefined.
    //jQuery.extend(atoms1, atoms2);

    //return atoms1;

    return this.unionHashNotInPlace(atoms1, atoms2);
};

iCn3D.prototype.unionHashNotInPlace = function(atoms1, atoms2) {
    var results = jQuery.extend({}, atoms1, atoms2);
    atoms1 = {};
    atoms2 = {};

    return results;
};

iCn3D.prototype.intHash2Atoms = function(atoms1, atoms2) {
    return this.hash2Atoms(this.intHash(atoms1, atoms2));
};

// get atoms in allAtoms, but not in "atoms"
iCn3D.prototype.exclHash2Atoms = function(includeAtoms, excludeAtoms) {
    return this.hash2Atoms(this.exclHash(includeAtoms, excludeAtoms));
};

iCn3D.prototype.unionHash2Atoms = function(atoms1, atoms2) {
    return this.hash2Atoms(this.unionHash(atoms1, atoms2));
};

iCn3D.prototype.hash2Atoms = function(hash) {
    var atoms = {};
    for(var i in hash) {
      atoms[i] = this.atoms[i];
    }

    hash = {};

    return atoms;
};

// from iview (http://istar.cse.cuhk.edu.hk/iview/)
iCn3D.prototype.exportCanvas = function () {
    this.render();
    window.open(this.renderer.domElement.toDataURL('image/png'));
};

// zoom
iCn3D.prototype.zoomIn = function (normalizedFactor) { // 0.1
  var para = {};
  para._zoomFactor = 1 - normalizedFactor;
  para.update = true;
  this.controls.update(para);
  this.render();
};

iCn3D.prototype.zoomOut = function (normalizedFactor) { // 0.1
  var para = {};
  para._zoomFactor = 1 + normalizedFactor;
  para.update = true;
  this.controls.update(para);
  this.render();
};

// rotate
iCn3D.prototype.rotateLeft = function (degree) { // 5
  var axis = new THREE.Vector3(0,1,0);
  var angle = -degree / 180.0 * Math.PI;

  axis.applyQuaternion( this.cam.quaternion ).normalize();

  var quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle( axis, -angle );

  var para = {};
  para.quaternion = quaternion;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.rotateRight = function (degree) { // 5
  var axis = new THREE.Vector3(0,1,0);
  var angle = degree / 180.0 * Math.PI;

  axis.applyQuaternion( this.cam.quaternion ).normalize();

  var quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle( axis, -angle );

  var para = {};
  para.quaternion = quaternion;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.rotateUp = function (degree) { // 5
  var axis = new THREE.Vector3(1,0,0);
  var angle = -degree / 180.0 * Math.PI;

  axis.applyQuaternion( this.cam.quaternion ).normalize();

  var quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle( axis, -angle );

  var para = {};
  para.quaternion = quaternion;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.rotateDown = function (degree) { // 5
  var axis = new THREE.Vector3(1,0,0);
  var angle = degree / 180.0 * Math.PI;

  axis.applyQuaternion( this.cam.quaternion ).normalize();

  var quaternion = new THREE.Quaternion();
  quaternion.setFromAxisAngle( axis, -angle );

  var para = {};
  para.quaternion = quaternion;
  para.update = true;

  this.controls.update(para);
  this.render();
};

// translate
iCn3D.prototype.translateLeft = function (percentScreenSize) { // 1
  var mouseChange = new THREE.Vector2(0,0);

  // 1 means the full screen size
  mouseChange.x -= percentScreenSize / 100.0;

  var para = {};
  para.mouseChange = mouseChange;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.translateRight = function (percentScreenSize) { // 1
  var mouseChange = new THREE.Vector2(0,0);

  mouseChange.x += percentScreenSize / 100.0;

  var para = {};
  para.mouseChange = mouseChange;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.translateUp = function (percentScreenSize) { // 1
  var mouseChange = new THREE.Vector2(0,0);

  mouseChange.y -= percentScreenSize / 100.0;

  var para = {};
  para.mouseChange = mouseChange;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.translateDown = function (percentScreenSize) { // 1
  var mouseChange = new THREE.Vector2(0,0);

  mouseChange.y += percentScreenSize / 100.0;

  var para = {};
  para.mouseChange = mouseChange;
  para.update = true;

  this.controls.update(para);
  this.render();
};

iCn3D.prototype.showPickingHilight = function(atom) {
  if(!this.bShift && !this.bCtrl) this.removeHlObjects();

  this.pickedAtomList = {};
  if(this.pk === 1) {
    this.pickedAtomList[atom.serial] = 1;
  }
  else if(this.pk === 2) {
    var residueid = atom.structure + '_' + atom.chain + '_' + atom.resi;
    this.pickedAtomList = this.residues[residueid];
  }
  else if(this.pk === 3) {
    this.pickedAtomList = this.selectStrandHelixFromAtom(atom);
  }
  else if(this.pk === 4) {
    var chainid = atom.structure + '_' + atom.chain;
    this.pickedAtomList = this.chains[chainid];
  }

  if(this.pk === 0) {
      this.bShowHighlight = false;
  }
  else {
      this.bShowHighlight = true;
  }

  var intersectAtoms = (Object.keys(this.hAtoms).length == Object.keys(this.atoms).length) ? {} : this.intHash(this.hAtoms, this.pickedAtomList);
  var intersectAtomsSize = Object.keys(intersectAtoms).length;

  if(!this.bShift && !this.bCtrl) {
      //if(intersectAtomsSize > 0) {
      //    this.hAtoms = this.exclHash(this.hAtoms, this.pickedAtomList);
      //}
      //else {
      //    this.hAtoms = this.cloneHash(this.pickedAtomList);
      //}
      this.hAtoms = this.cloneHash(this.pickedAtomList);
  }
  else if(this.bShift) { // select a range

    if(this.prevPickedAtomList === undefined) {
        this.hAtoms = this.unionHash(this.hAtoms, this.pickedAtomList);
    }
    else {
        var prevAtom = this.getFirstAtomObj(this.prevPickedAtomList);
        var currAtom = this.getFirstAtomObj(this.pickedAtomList);

        var prevChainid = prevAtom.structure + '_' + prevAtom.chain;
        var currChainid = currAtom.structure + '_' + currAtom.chain;

        if(prevChainid != currChainid) {
            this.hAtoms = this.unionHash(this.hAtoms, this.pickedAtomList);
        }
        else { // range in the same chain only
            var combinedAtomList = this.unionHash(this.prevPickedAtomList, this.pickedAtomList);

            var firstAtom = this.getFirstAtomObj(combinedAtomList);
            var lastAtom = this.getLastAtomObj(combinedAtomList);

            for(var i = firstAtom.serial; i <= lastAtom.serial; ++i) {
                this.hAtoms[i] = 1;
            }
        }
    }

    // remember this shift selection
    this.prevPickedAtomList = this.cloneHash(this.pickedAtomList);
  }
  else if(this.bCtrl) {
      if(intersectAtomsSize > 0) {
          this.hAtoms = this.exclHash(this.hAtoms, this.pickedAtomList);
      }
      else {
          this.hAtoms = this.unionHash(this.hAtoms, this.pickedAtomList);
      }
  }

  this.removeHlObjects();
  this.addHlObjects();
};

iCn3D.prototype.showPicking = function(atom, x, y) { var me = this;
    this.showPickingBase(atom, x, y); // including render step
};

iCn3D.prototype.showPickingBase = function(atom, x, y) { var me = this;
  if(x === undefined && y === undefined) { // NOT mouse over
      this.showPickingHilight(atom); // including render step
  }
};

iCn3D.prototype.removeHlObjects = function () {
   // remove prevous highlight
   for(var i in this.prevHighlightObjects) {
       this.mdl.remove(this.prevHighlightObjects[i]);
   }

   this.prevHighlightObjects = [];

   // remove prevous highlight
   for(var i in this.prevHighlightObjects_ghost) {
       this.mdl.remove(this.prevHighlightObjects_ghost[i]);
   }

   this.prevHighlightObjects_ghost = [];

   if(this.bChainAlign) {
       // remove prevous highlight
       for(var i in this.prevHighlightObjects2) {
           this.mdl.remove(this.prevHighlightObjects2[i]);
       }

       this.prevHighlightObjects2 = [];

       // remove prevous highlight
       for(var i in this.prevHighlightObjects_ghost2) {
           this.mdl.remove(this.prevHighlightObjects_ghost2[i]);
       }

       this.prevHighlightObjects_ghost2 = [];
   }
};

iCn3D.prototype.addHlObjects = function (color, bRender, atomsHash) {
   if(color === undefined) color = this.hColor;
   if(atomsHash === undefined) atomsHash = this.hAtoms;

   this.applyDisplayOptions(this.opts, this.intHash(atomsHash, this.dAtoms), this.bHighlight);

   if(bRender === undefined || bRender) this.render();
};

iCn3D.prototype.resetOrientation = function() {
    var bSet = false;
    if(this.commands.length > 0) {
        var commandTransformation = this.commands[0].split('|||');

        if(commandTransformation.length == 2) {
            var transformation = JSON.parse(commandTransformation[1]);

            this._zoomFactor = transformation.factor;

            this.mouseChange.x = transformation.mouseChange.x;
            this.mouseChange.y = transformation.mouseChange.y;

            this.quaternion._x = transformation.quaternion._x;
            this.quaternion._y = transformation.quaternion._y;
            this.quaternion._z = transformation.quaternion._z;
            this.quaternion._w = transformation.quaternion._w;

            bSet = true;
        }
    }

    if(!bSet) {
        this._zoomFactor = 1.0;
        this.mouseChange = new THREE.Vector2(0,0);
        this.quaternion = new THREE.Quaternion(0,0,0,1);
    }

    //reset this.maxD
    this.maxD = this.oriMaxD;
    this.center = this.oriCenter.clone();

    if(this.ori_chemicalbinding == 'show') {
        this.bSkipChemicalbinding = false;
    }
    else if(this.ori_chemicalbinding == 'hide') {
        this.bSkipChemicalbinding = true;
    }
};

 // from iview (http://istar.cse.cuhk.edu.hk/iview/)
 iCn3D.prototype.getAtomsFromPosition = function(point, threshold) {
    var i, atom;

    if(threshold === undefined || threshold === null) {
      threshold = 1;
    }

    for (i in this.atoms) {
       var atom = this.atoms[i];

       //if(atom.coord.x < point.x - threshold || atom.coord.x > point.x + threshold) continue;
       //if(atom.coord.y < point.y - threshold || atom.coord.y > point.y + threshold) continue;
       //if(atom.coord.z < point.z - threshold || atom.coord.z > point.z + threshold) continue;

       if(this.ions.hasOwnProperty(i) && this.opts['ions'] === 'sphere') {
           var adjust = this.vdwRadii[atom.elem.toUpperCase()];

           if(Math.abs(atom.coord.x - point.x) - adjust > threshold) continue;
           if(Math.abs(atom.coord.y - point.y) - adjust > threshold) continue;
           if(Math.abs(atom.coord.z - point.z) - adjust > threshold) continue;
       }
       else {
           if(atom.coord.x < point.x - threshold || atom.coord.x > point.x + threshold) continue;
           if(atom.coord.y < point.y - threshold || atom.coord.y > point.y + threshold) continue;
           if(atom.coord.z < point.z - threshold || atom.coord.z > point.z + threshold) continue;
       }

       return atom;
    }

    return null;
 };

iCn3D.prototype.getFirstAtomObj = function(atomsHash) {
    if(atomsHash == undefined) return this.atoms[0];

    var atomKeys = Object.keys(atomsHash);
    var firstIndex = atomKeys[0];

    return this.atoms[firstIndex];
};

iCn3D.prototype.getFirstCalphaAtomObj = function(atomsHash) {
    if(atomsHash == undefined) return this.atoms[0];

    var firstIndex;

    for(var i in atomsHash) {
        if(this.atoms[i].name == 'CA') {
            firstIndex = i;
            break;
        }
    }

    return (firstIndex !== undefined) ? this.atoms[firstIndex] : this.getFirstAtomObj(atomsHash);
};

iCn3D.prototype.getLastAtomObj = function(atomsHash) {
    var atomKeys = Object.keys(atomsHash);
    var lastIndex = atomKeys[atomKeys.length - 1];

    return this.atoms[lastIndex];
};

 // http://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
 iCn3D.prototype.hexToRgb = function (hex, a) {
     var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
     return result ? {
         r: parseInt(result[1], 16),
         g: parseInt(result[2], 16),
         b: parseInt(result[3], 16),
         a: a
     } : null;
 };

iCn3D.prototype.selectStrandHelixFromAtom = function(atom) {
    var firstAtom = atom;
    var lastAtom = atom;

    var atomsHash = {};

    // fill the beginning
    var beginResi = firstAtom.resi;
    if(!firstAtom.ssbegin) {
        for(var i = firstAtom.resi - 1; i > 0; --i) {
            var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
            if(!this.residues.hasOwnProperty(residueid)) break;

            var atom = this.getFirstCalphaAtomObj(this.residues[residueid]);
            beginResi = atom.resi;

            if( (firstAtom.ss !== 'coil' && atom.ss === firstAtom.ss && atom.ssbegin)
              || (firstAtom.ss === 'coil' && atom.ss !== firstAtom.ss) ) {
                if(firstAtom.ss === 'coil' && atom.ss !== firstAtom.ss) {
                    beginResi = atom.resi + 1;
                }
                break;
            }
        }

        for(var i = beginResi; i <= firstAtom.resi; ++i) {
            var residueid = firstAtom.structure + '_' + firstAtom.chain + '_' + i;
            atomsHash = this.unionHash(atomsHash, this.hash2Atoms(this.residues[residueid]));
        }
    }

    // fill the end
    var endResi = lastAtom.resi;
    var endChainResi = this.getLastAtomObj(this.chains[lastAtom.structure + '_' + lastAtom.chain]).resi;
    for(var i = lastAtom.resi + 1; i <= endChainResi; ++i) {
        var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
        if(!this.residues.hasOwnProperty(residueid)) break;

        var atom = this.getFirstCalphaAtomObj(this.residues[residueid]);
        endResi = atom.resi;

        if( (lastAtom.ss !== 'coil' && atom.ss === lastAtom.ss && atom.ssend) || (lastAtom.ss === 'coil' && atom.ss !== lastAtom.ss) ) {
            if(lastAtom.ss === 'coil' && atom.ss !== lastAtom.ss) {
                endResi = atom.resi - 1;
            }
            break;
        }
    }

    for(var i = lastAtom.resi + 1; i <= endResi; ++i) {
        var residueid = lastAtom.structure + '_' + lastAtom.chain + '_' + i;
        atomsHash = this.unionHash(atomsHash, this.hash2Atoms(this.residues[residueid]));
    }

    return atomsHash;
};

iCn3D.prototype.addNonCarbonAtomLabels = function (atoms) {
    var size = 18;
    var background = "#FFFFFF";

    var atomsHash = this.intHash(this.hAtoms, atoms);

    if(this.labels['schematic'] === undefined) this.labels['schematic'] = [];

    for(var i in atomsHash) {
        var atom = this.atoms[i];

        //if(!atom.het) continue;
        if(!this.residues.hasOwnProperty(atom.structure + '_' + atom.chain + '_' + atom.resi)) continue;
        if(atom.elem === 'C') continue;

        var label = {}; // Each label contains 'position', 'text', 'color', 'background'

        label.position = atom.coord;

        label.bSchematic = 1;

        label.text = atom.elem;
        label.size = size;

        label.color = "#" + atom.color.getHexString();
        label.background = background;

        this.labels['schematic'].push(label);
    }

    this.removeHlObjects();
};

iCn3D.prototype.addResiudeLabels = function (atoms, bSchematic, alpha) {
    var size = 18;
    var background = "#CCCCCC";
    if(alpha === undefined) alpha = 1.0;

    var atomsHash = this.intHash(this.hAtoms, atoms);

    if(bSchematic) {
        if(this.labels['schematic'] === undefined) this.labels['schematic'] = [];
    }
    else {
        if(this.labels['residue'] === undefined) this.labels['residue'] = [];
    }

    var prevReidueID = '';
    for(var i in atomsHash) {
        var atom = this.atoms[i];

        // allow chemicals
        //if(atom.het) continue;

        var label = {}; // Each label contains 'position', 'text', 'color', 'background'

        var currReidueID = atom.structure + '_' + atom.chain + '_' + atom.resi;

        if( (!atom.het && (atom.name === 'CA' || atom.name === "O3'" || atom.name === "O3*") )
          || this.water.hasOwnProperty(atom.serial)
          || this.ions.hasOwnProperty(atom.serial)
          || (this.chemicals.hasOwnProperty(atom.serial) && currReidueID !== prevReidueID) ) {
            label.position = atom.coord;

            label.bSchematic = 0;
            if(bSchematic) label.bSchematic = 1;

            label.text = this.residueName2Abbr(atom.resn);
            label.size = size;

            var atomColorStr = atom.color.getHexString().toUpperCase();
            label.color = (atomColorStr === "CCCCCC" || atomColorStr === "C8C8C8") ? "#888888" : "#" + atomColorStr;
            label.background = background;
            //label.alpha = alpha; // this.hideLabels() didn't work. Remove this line for now

            if(bSchematic) {
                this.labels['schematic'].push(label);
            }
            else {
                this.labels['residue'].push(label);
            }
        }

        prevReidueID = currReidueID;
    }

    this.removeHlObjects();
};

iCn3D.prototype.setCenter = function(center) {
   if(!this.bChainAlign) {
       this.mdl.position.set(0,0,0);
       this.mdlImpostor.position.set(0,0,0);
       this.mdl_ghost.position.set(0,0,0);

       this.mdl.position.sub(center);
       //this.mdlPicking.position.sub(center);
       this.mdlImpostor.position.sub(center);
       this.mdl_ghost.position.sub(center);
   }
};

iCn3D.prototype.getResiduesFromAtoms = function(atomsHash) {
    var residuesHash = {};
    for(var i in atomsHash) {
        var residueid = this.atoms[i].structure + '_' + this.atoms[i].chain + '_' + this.atoms[i].resi;
        residuesHash[residueid] = 1;
    }

    return residuesHash;
};

iCn3D.prototype.getResiduesFromCalphaAtoms = function(atomsHash) {
    var residuesHash = {};
    for(var i in atomsHash) {
        if((this.atoms[i].name == 'CA' && this.proteins.hasOwnProperty(i)) || !this.proteins.hasOwnProperty(i)) {
            var residueid = this.atoms[i].structure + '_' + this.atoms[i].chain + '_' + this.atoms[i].resi;
            residuesHash[residueid] = 1;
        }
    }

    return residuesHash;
};

