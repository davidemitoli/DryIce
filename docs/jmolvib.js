// Defaults
authors="";
title="";
caption="";
ampl_vib=3;
ampl_vec=10;
fileName="";
fileContent="";
flagInputFile = false;
// reference="";
// myscript="";
////////// Recovering inputs (jmol scripts, xyz and crystal outputs)
args =window.location.href.substring(window.location.href.indexOf("?")+1).replace(/%22/g,"");
targs=args.split('&');
withJmolFile=false;
jmolFileName ="";
//crystalOutput=true;
//xyzFile=false;
for(var iarg=0;iarg<targs.length;iarg++){
    tkey=targs[iarg].split('=');
    switch (tkey[0]) {
        case 'output':
            fileName =tkey[1];
            crystalOutput=true;
            xyzFile=false;
            break;
        case 'name':
        case 'cartesian':
            fileName =tkey[1];
            crystalOutput=false;
            xyzFile=true;
            break;
        case 'spt':
            jmolFileName =tkey[1];
            withJmolFile=true;
            break;
    }
}

function setParameters(file_ext) {
    if (file_ext == 'out') {
        fileName =tkey[1];
        crystalOutput=true;
        xyzFile=false;
    }
    if (file_ext == 'xyz'){
        fileName =tkey[1];
        crystalOutput=false;
        xyzFile=true;
    }
    if (file_ext == 'spt') {
        jmolFileName = tkey[1];
        withJmolFile = true;
    }
}
// Definition of the Jmol parameters
var info = {
    color: "#FFFFFF", // white background (note this changes legacy default which was black)
    height: "100%",      // pixels (but it may be in percent, like "100%")
    width: "100%",
    use: "HTML5",     // "HTML5" or "Java" (case-insensitive)
    j2sPath: "jsmol/j2s",          // only used in the HTML5 modality
    jarPath: "java",               // only used in the Java modality
    jarFile: "JmolApplet0.jar",    // only used in the Java modality
    isSigned: false,               // only used in the Java modality
    readyFunction: jmolIsReady,
    debug: false
};
////////////////////////////////////////////////////
//var iamready = false
var item0
var previousPoint = null
var data = []



if(typeof(myscript)=="undefined"){myscript=""}
defaultScript=" set antialiasdisplay ON;set displayCellParameters OFF;set frank off;";
////////////////////////////////////////////////////////////
function init(s){
    if (flagInputFile){
        Jmol.scriptWait(jmolApplet0,'set refreshing false;load data "vib"\n' + fileContent + '\nend "vib";');
    }
    else {
        if (fileName != "")
            // Jmol.scriptWait(jmolApplet0,'set refreshing false;load models ({0}) "'+fileName+'";');
//            Jmol.scriptWait(jmolApplet0,'set refreshing false;load "'+fileName+'" ;');
            Jmol.scriptWait(jmolApplet0,'set refreshing false;load "'+fileName+'" packed filter "conv";');
    }
// First partial load in order to get information on the system
    periodicity=getPeriodicity();
    var scrDefCell=loadInCell(defaultScript+s);
    firstFreq=0;
    getJmolInfo();
    getTabModes();
    TYV=TabModes;
    vibSymm=getSymmetries(); // From now firstFreq is known
    updateModes();
    buildLegend();
    fillHtml();
    document.getElementById('select_ir_raman').style.display = 'block';
    if (fileName != "")
        Jmol.script(jmolApplet0,"set loadStructCallback 'plotSpectra';set refreshing false;model "+(TabModes[firstFreq].ModelNumber+1)+";center visible;axes off;"+myscript+"set refreshing true;");
    // final load
    update(); // to be synchronized HTML controls - Jmol display
}
////////////////////////////////////////////////////////////
function loadInCell(s){
// loads the file with atoms eventullay inside the cell 
    var loadedWithCell=false;
    scrDefCell='';
    if(periodicity>0){
        loadedWithCell=Jmol.getPropertyAsArray(jmolApplet0,"auxiliaryInfo.Models")[0].infoUnitCell;
        // loadedWithCell true only if loaded with a unitcell
        if(crystalOutput){
//  alert([periodicity,crystalOutput,].join('@'))
            if(typeof(loadedWithCell)!="undefined"){
                // Periodic system AND crystal output
                if (flagInputFile) {
                    Jmol.scriptWait(jmolApplet0,'load data "vib"\n' + fileContent + '\nend "vib" {555 555 -1} filter "conv";'+s);
                }
                else {
                    Jmol.scriptWait(jmolApplet0,'load "'+fileName+'" packed filter "conv";'+s);
                }
                loadedWithCell=true;
            }
        }else{
            // periodic but XYZ file
            // from now unitcell Jmol command works
            if (flagInputFile) {
                Jmol.scriptWait(jmolApplet0,'set refreshing false; load data "vib"\n' + fileContent + '\nend "vib";'+s);
            }
            else {
                Jmol.scriptWait(jmolApplet0,'set refreshing false;load "'+fileName+'";'+s);
            }
            loadedWithCell=false; //Still not loaded with unitcell
            scrDefCell='scrDefCell="unitcell [ "+@UC+" ]";script inline @scrDefCell;';
        }
    }else{
        // Molecule  (XYZ or output)
        if (flagInputFile) {
            Jmol.scriptWait(jmolApplet0,'set refreshing false; load data "vib"\n' + fileContent + '\nend "vib";'+s);
        }
        else {
            Jmol.scriptWait(jmolApplet0,'set refreshing false;load "'+fileName+'";'+s);
        }
        loadedWithCell=false; //Still not loaded with unitcell
    }
    return  scrDefCell;
}
////////////////////////////////////////////////////////////
function update(){
// Executed each time something is changed
    var str="select all;";
    if(document.getElementById("vib_on").checked){
        str=str+"vibration ON;"
    }else{
        str=str+"vibration OFF;"
    }
    if(document.getElementById("as1").checked){ str=str+"vibration scale "+ampl_vib+";" }
    if(document.getElementById("as2").checked){ str=str+"vibration scale "+ampl_vib*2+";" }
    if(document.getElementById("as3").checked){ str=str+"vibration scale "+ampl_vib*4+";" }

    if(document.getElementById("vect_on").checked){
        str=str+"vector ON;vector 0.03;"
    }else{
        str=str+"vector OFF;"
    }
    if(document.getElementById("vs1").checked){ str=str+"vector scale "+ampl_vec+";" }
    if(document.getElementById("vs2").checked){ str=str+"vector scale "+ampl_vec*2.5+";" }
    if(document.getElementById("vs3").checked){ str=str+"vector scale "+ampl_vec*5+";" }

    if(periodicity==0){
        document.getElementById("cellCtrl").style.display="none";
    }else{
        if(document.getElementById("cell").checked){
            str=str+"unitcell on;"
        }else{
            str=str+"unitcell off;"
        }
    }
    if(document.getElementById("persp").checked){
        str=str+"set perspectivedepth ON;"
    }else{
        str=str+"set perspectivedepth OFF;"
    }

    if(document.getElementById("at_tiny").checked){ str=str+"spacefill 5 %;" }
    if(document.getElementById("at_small").checked){ str=str+"spacefill 8 %;" }
    if(document.getElementById("at_normal").checked){ str=str+"spacefill 15 %;" }

    if(document.getElementById("bond_tiny").checked){ str=str+"wireframe 0.05;" }
    if(document.getElementById("bond_small").checked){ str=str+"wireframe 0.1;" }

    MN=document.getElementById("modes").value;
    if(! MN){ MN=parseInt(firstFreq)}
    str="model "+(TabModes[MN].ModelNumber+1)+";"+scrDefCell+";set echo bottom left;color echo black;font echo 14 serif ;echo "
        +"["+(parseInt(MN)+1)+"] "+ TabModes[MN].setLabel()+";"+str+myscript +";script inline @commun;"+scr;
    Jmol.script(jmolApplet0,str);
    return str;
}
////////////////////////////////////////////////////////////
function getJmolInfo(){
    atomInfo=Jmol.getPropertyAsArray(jmolApplet0,"atomInfo");
}
///////////////////////////////////////////////////////////
function getTabModes(){
    TabModes=[];
    var vibrationalSymmetry="";
    var FreqValue=0;
    var IRactivity="";
    var IRintensity=0;
    var Ramanactivity="";
    var Ramanintensity=0;
    var FrequencyLabel="";
    var ModelNumber=0;
    var imode=0;
    MI=Jmol.getPropertyAsArray(jmolApplet0,"modelInfo");
    AI=Jmol.getPropertyAsArray(jmolApplet0,"auxiliaryInfo");
    modelSetName=MI.modelSetName;
    withRamanIntens = false;
    for(imodel=0;imodel<MI.modelCount;imodel++){
        if(MI.models[imodel].vibrationVectors){
            if(crystalOutput){
                MP=MI.models[imodel].modelProperties;
         //       MP=AI.models[imodel].modelProperties;
                RI=(AI.models[imodel].ramanInfo?AI.models[imodel].ramanInfo:false);
                vibrationalSymmetry = MP.vibrationalSymmetry;
                FreqValue = (MP.FreqValue?parseFloat(MP.FreqValue):0);
                IRactivity = MP.IRactivity;
                IRintensity = (MP.IRintensity?parseFloat(MP.IRintensity):0);
                Ramanactivity = MP.Ramanactivity;
		//Ramanintensity = (MP.Ramanintensity?parseFloat(MP.Ramanintensity):0);;
		if(RI){
		  Ramanintensity = (RI.isotropicIntensities?parseFloat(RI.isotropicIntensities[0]):0);
                  withRamanIntens = true;
		}else{
		  Ramanintensity = 0.0;
		}
                ////////////////////////////////////////////////////////////////
//                Ramanintensity = parseFloat(IRintensity) + Math.random()*100; // FOR TEST  //
                ////////////////////////////////////////////////////////////////
                FrequencyLabel =MP.FrequencyLabel;
            }else{
                modelname=MI.models[imodel].name;
                modelname=modelname.split("]: ")[1];
                vibrationalSymmetry=getFromName(modelname,"vibrationalSymmetry");
                FreqValue=getFromName(modelname,"FreqValue");
                IRactivity=getFromName(modelname,"IRactivity");
                IRintensity=getFromName(modelname,"IRintensity");
                IRintensity=IRintensity.replace(" km/Mole","")
                Ramanactivity=getFromName(modelname,"Ramanactivity");
//                Ramanintensity=getFromName(modelname,"Ramanintensity");
                ////////////////////////////////////////////////////////////////
                Ramanintensity = 0; // FOR TEST  //
                withRamanIntens = false;
                ////////////////////////////////////////////////////////////////
                FrequencyLabel=getFromName(modelname,"FrequencyLabel");
            }
            ModelNumber=imodel;
            TabModes[imode++]=new Mode(FreqValue,FrequencyLabel,IRactivity,IRintensity,Ramanactivity,Ramanintensity,vibrationalSymmetry,ModelNumber);
        }
    }
    //return TabModes
}
////////////////////////////////////////////////////////////
function getSymmetries(){
    var nbDiffSymm=0;
    var TabSymm=[];
    var Symm="";
    var found=false;
    if(isymm){
        for(var isymm=0;isymm<document.getElementById("symmetries").length;isymm++){
            document.getElementById("symmetries").options[isymm]=null;
        }
    }
    for(var imod=0;imod<TabModes.length;imod++){
        Symm=TabModes[imod].vibrationalSymmetry;
        if(firstFreq==0 && TabModes[imod].FreqValue>50){firstFreq=imod}
        found=false;
        for(var isymm=0;isymm<TabSymm.length;isymm++){
            if(Symm==TabSymm[isymm]){found=true;break}
        }
        if(! found){
            TabSymm[nbDiffSymm]=Symm;
            document.getElementById("symmetries").options[nbDiffSymm]=new Option(Symm,Symm);
            nbDiffSymm++;
        }
    }
    document.getElementById("symmetries").options[0].defaultSelected=true;
    return TabSymm ;
}
////////////////////////////////////////////////////////////
function buildLegend(){
    var str="<TABLE border='0'><TR>\n";
    var nbDiffElem=0;
    var elem="";
    var nbelem=0;
    var sysElem=new Array();
    var sysSym=new Array();
    var sysColor=new Array();
    var found=false;
    for(var iat=0;iat<atomInfo.length;iat++){
        elem=atomInfo[iat].elemno;
        found=false;
        for(var ielem=0;ielem<sysElem.length;ielem++){
            if(elem==sysElem[ielem]){found=true;break}
        }
        if(! found){
            sysElem.push(elem);
            sysSym.push(atomInfo[iat].sym);
            sysColor.push("#"+atomInfo[iat].color.substr(2,6).toUpperCase());
            nbelem=sysElem.length;
            str=str+"<TD WIDTH=30 ALIGN='center' STYLE='background-color:";
            str=str+sysColor[nbelem-1];
            str=str+";'><B><BIG>"+sysSym[nbelem-1]+"</BIG></B></TD>";
        }
    }
    str=str+"</TR></TABLE>";
    document.getElementById("legend").innerHTML= str;
}
////////////////////////////////////////////////////////////
function getPeriodicity(){
    var p=Jmol.getPropertyAsString(jmolApplet0,"auxiliaryInfo.symmetryType");
    if(p.indexOf('MOLECULAR')>0){
        p=0;
    }else{
        temp=p.indexOf('D');
        if(temp>0){
            p=Number(p.substring(temp-1,temp));
        }else{
            p=3;
        }
    }
    return p;
}
////////////////////////////////////////////////////////////
function updateModes(){
    ionly=0;

    for(imod=document.getElementById("modes").length-1;imod>=0;imod--){
        document.getElementById("modes").options[imod]=null;
    }
    radio=document.getElementsByName("Only")
    for(iradio=radio.length-1;iradio>=0;iradio--){
        if(radio[iradio].checked){ionly=iradio;}
    }
    imodOnly=0;
    for(var imode=0;imode<TabModes.length;imode++){
        var mode=TabModes[imode];
        switch(ionly) {
            case 0:  // All
                document.getElementById("modes").options[imodOnly]=new Option(mode.FreqValue,imode);
                imodOnly++;
                break;
            case 1: // IR
                if(mode.IRactivity=="A"){
                    document.getElementById("modes").options[imodOnly]=new Option(mode.FreqValue,imode);
                    imodOnly++;
                }
                break;
            case 2: // Raman
                if(mode.Ramanactivity=="A"){
                    document.getElementById("modes").options[imodOnly]=new Option(mode.FreqValue,imode);
                    imodOnly++;
                }
                break;
            case 3: // Symmetry
                if(mode.vibrationalSymmetry==document.getElementById("symmetries").value){
                    document.getElementById("modes").options[imodOnly]=new Option(mode.FreqValue,imode);
                    imodOnly++;
                }
                break;
        }
    }
}
////////////////////////////////////////////////////////////
function getFromName(str,expr) {
    var tabKeys=str.split(";");
    var val="";
    for(var i = 0;i<tabKeys.length;i++){
        var temp=tabKeys[i].split("=");
        if(expr==temp[0]){
            val=temp[1];
            break;
        };
    }
    return val;
}
////////////////////////////////////////////////////////////
function fillHtml(){
    //if(typeof(authors=="undefined" || authors=="")){authors="CRYSTAL user"}
    //if(typeof(title)=="undefined" || title==""){title=modelSetName}
    //if(typeof(title)=="undefined" || title==""){title="Animation of vibrational modes and Simulated IR/Raman spectra with CRYSTAL"}
    //if(typeof(reference)=="undefined" || reference==""){reference="Unpublished"}
    document.getElementById("cite").innerHTML=reference;
    document.getElementById("auth").innerHTML=authors;
    document.getElementById("titre").innerHTML=title;
    document.getElementById("caption").innerHTML=caption;
}
////////////////////////////////////////////////////////////
function jmolIsReady(){
    plotSpectra();
    myplot=document.getElementById('myDiv')
    myplot.on('plotly_click', function(data){
        var nuClicked=data.points[0].x;
        updateList(Tspec[nuClicked]);
    });
}
///////////////////////////////////////////////////
//         PLOTLY PART
///////////////////////////////////////////////////

function plotSpectra(a,b,c,d,e){
    if (c == "zapped"){//alert("zapped");
return}
    if(document.getElementById("IR").checked){typeSpec="IR"}else{typeSpec="Raman"}
    var TT=modesToCurve(typeSpec);
    Tx=TT[0];
    Ty=TT[1];
    Tspec=TT[2];
    var dataset = [
        { label: "ligne",
            lines:{lineWidth:1},
            data: Tspec,
            color:"black",
            hoverable: false,
            clickable: true
        }
    ];
    data_plotly={
        x:Tx,
        y:Ty,
        lines:{lineWidth:2},
        mode:'lines'
    };
    var options = {
        grid: { hoverable: true, clickable: true,
            hoverDelay: 20, hoverDelayDefault: 10 },
        legend: {show:false}
    };
    var layout = {
        title: "INFRARED SPECTRA",
        showlegend: false,
        xaxis: {
            showline: true,
            mirror: true,
            title: 'Wavenumbers ν (cm<sup>−1</sup>)',
            range:[0,numax]
        },
        yaxis: {
            showline: true,
            mirror: true,
            zeroline: false
        }
    };
    myplot=Plotly.newPlot('myDiv', [data_plotly], layout);
}
////////////////////////////////////////////////////////////
function changeTitlePlotly (spectra_type) {
    if (spectra_type == 0) {
        var test = document.getElementById('myDiv');
        test.layout.title = 'INFRARED SPECTRA';
        Plotly.redraw(test);
    }

    else if (spectra_type == 1) {
        var test = document.getElementById('myDiv');
        test.layout.title = 'RAMAN SPECTRA';
        Plotly.redraw(test);

    }
}
////////////////////////////////////////////////////////////
function modesToCurve(Type){
// For each point of the curve computes and sum the contribution of each mode
// For each point of the curve the most contributing mode is also stored
    Tspec = [];
    Tx=[];
    Ty=[];
    var nplots = 1
    var limdown =0.;
    var limup = 5000 ;
    var limIntens=2;
    var step = 1 ;
    var npoi = Math.ceil((limup-limdown)/step)
    var nmod =1
    var wid = 8
    var pi = Math.PI
    var nu =-step;
    numax=0;
    var tol=0.05;
    for (var ipoi=0;ipoi<=npoi;ipoi++){
        nu=nu+step ;
        spec=0;
        var modmax=0;
        var contribmax=0;
        for (var imode=0;imode<TabModes.length;imode++){
            var iint=(Type=="IR"?TabModes[imode].IRintensity:TabModes[imode].Ramanintensity);
            var freq=TabModes[imode].FreqValue;
            var contrib=iint/pi*wid/2./((nu-freq)*(nu-freq)+wid*wid/4.)
            if(contrib>contribmax){
                modmax=imode;
                contribmax=contrib;
            }
            spec=spec+contrib;
        }
        Tspec.push([nu,spec,modmax,contribmax]);
        Tx.push(nu);
        Ty.push(spec);
	if(spec>tol){numax=nu}
	if(Type!="IR" && ! withRamanIntens){numax=nu}
    }
    var ret=[Tx,Ty,Tspec];
    return ret;
}
////////////////////////////////////////////////////////////
function getneigbors(f,Type){
    var deltaf=10;
    var modeCount = TabModes.length
    neigIntens=[];
    neigFreq=[];
    var tabModesNeig= []
    j=0;
    if (f){
        for (var i = 0; i < modeCount; i++) {
            if (TabModes[i].FreqValue){
                var activ=(Type="IR"?TabModes[i].IRactivity:TabModes[i].Ramanactivity)
                if(activ=="A"){
                    if ((f-deltaf)<TabModes[i].FreqValue ){
                        if (TabModes[i].FreqValue <(f+deltaf)) {
                            tabModesNeig[j]= i;
                            j++;
                        }
                    }
                }
            }
        }
    }
    return tabModesNeig;
}
////////////////////////////////////////////////////////////
function updateList(nuClicked){
// Updates the select list of modes on the page
    var nu=nuClicked[0];
    var sumContrib=nuClicked[1];
    var mostContribMode=nuClicked[2];
    var contribMax=nuClicked[3];
    var tol=0.005;
    var selectbox=document.getElementById("modes");
    for(var i = selectbox.options.length - 1 ; i >= 0 ; i--){
        selectbox.remove(i);
    }
    Tin=getneigbors(nu,"IR")
    if(Tin.length>0){
        var myindex=0;
        for(var i=0;i<Tin.length;i++){
            var opt = document.createElement("option");
//			var nn=TabModes[Tin[i]].modelNumber-2;
            opt.text= TabModes[Tin[i]].FreqValue ;
            opt.value=Tin[i];
            if(Tin[i]==(mostContribMode)) myindex=i;
            document.getElementById("modes").options.add(opt)
        }
        document.getElementById("modes").selectedIndex=myindex;
        listonchange();
    }else{
        if(contribMax>tol){
            var opt = document.createElement("option");
            opt.value=TabModes[mostContribMode].ModelNumber;
            var n=opt.value-1;
            opt.text=TabModes[mostContribMode].FreqValue;
            document.getElementById("modes").options.add(opt)
            document.getElementById("modes").selectedIndex=0;
            listonchange();
        }
    }
}
////////////////////////////////////////////////////////////
function listonchange(e){
    selectbox=document.getElementById("modes");
    var im=TabModes[parseInt(selectbox.value)].ModelNumber;
    //  var str=TabModes[TabModels[im]].setLabel();
    var script = ' model 1.'+(im+1) //+';font echo 16; set echo top left;echo '+str;
    Jmol.scriptWait(jmolApplet0,script)
    update();
    return im ;
}
////////////////////////////////////////////////////////////
//         Objects
////////////////////////////////////////////////////////////
function modelInf(modelSetName,modelCount,models) {
    this.modelSetName = modelSetName;
    this.modelCount = modelCount;
    this.models = models;
}
////////////////////////////////////////////////////////////
function modell(name,num,vibrationVectors,modelProperties) {
    this.name = name;
    this.num = num;
    this.vibrationVectors = vibrationVectors;
    this.modelProperties = modelProperties;
}
////////////////////////////////////////////////////////////
function Mode(FreqValue,FrequencyLabel,IRactivity,IRintensity,Ramanactivity,Ramanintensity,vibrationalSymmetry,ModelNumber) {
    this.FreqValue = FreqValue;
    this.FrequencyLabel = FrequencyLabel;
    this.IRactivity = IRactivity;
    this.IRintensity = IRintensity;
    this.Ramanactivity = Ramanactivity;
    this.Ramanintensity = Ramanintensity;
    this.vibrationalSymmetry = vibrationalSymmetry;
    this.ModelNumber=ModelNumber;
    this.setLabel=function (){
        var nn=this.ModelNumber;
        lab = 'Symm : '
            + this.vibrationalSymmetry + ',  Freq : '
            + Math.round(this.FreqValue)
            + 'cm<sup>-1</sup>'
            +',  IR activity : '+this.IRactivity
            +',  Raman activity : '+this.Ramanactivity;
        this.FrequencyLabel=lab;
        return lab;
    }

}
////////////////////////////////////////////////////////////
/*function Mode_(im,fr,sy,na,ira,iri,lab){
 this.modelNumber=im;
 this.frequency=fr;
 this.symmetry=sy;
 this.name=na;
 this.IRAct=ira;
 this.IRIntens=iri;
 this.label=lab;
 }*/
/////////////////////////////////////////////////
