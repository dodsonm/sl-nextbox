/*
    NOTE: ARTICLE DATA is stored in two locations in the global scope:
    1. Next Slate Article: SlateNextbox.data (found in contentpage/head.jsp)
    2. MySlate User Data: MYS.userData (set in mys-state-controller.js)
    
    NOTE: BOX SUPPRESSION: Close button in box sets a cookie, 
    sl-nbox-sleeping='true'. This is checked in SlateNextBox.StateController. If
    it exists, state=sleeping.
    
    NOTE: CLICK TRAX - A/B TESTING: "Dark" treatment = "A", "Light" treatment = 
    "B" track attrs set in the shell factories & addContent method. $().track() 
    called on first slide-in and only the first slide in (InitState.showBox())
*/

$(document).ready(function(){
    //MYS(){} instantiated in state controller
    if(typeof(SlateNextbox) !== "undefined" && $('#sl-nbox-signpost').length > 0){ 
        MYS.sc = new MYS.StateController();
        MYS.nb = new SlateNextBox();
    }
});

function SlateNextBox(){    
    this.init.subscribe(Dispatcher.stateChanged);
}
SlateNextBox.prototype.init = function(d){
    //console.info('[SlateNextBox init]');
    //console.info(d);
    
    this.TREATMENT_A = "Dark";
    this.TREATMENT_B = "DarkNarrow";
    this.BREAK = 50;
    this.cntr = $('#sl-nbox-cntr');
    this.sc = new  SlateNextBox.StateController();
        
    if(!$.cookie('sl-nbox-ctrl')){
        $.cookie(
            'sl-nbox-ctrl', 
            parseInt(Math.random()*100), 
            {
                expires: 90,
                domain:'slate.com',
                path:'/'
            }
        );
    }
            
    this.ctrl = parseInt($.cookie('sl-nbox-ctrl'));
    this.treatment = (ctrl <= this.BREAK)? this.TREATMENT_B : this.TREATMENT_A;        
    this.shell = new SlateNextBoxShell.factory(this.treatment);
    this.content = new SlateNextBoxContent.factory(MYS.sc.state.name);

    this.shell.addContent(this.content);

    this.cntr.empty();
    this.cntr.append(this.shell.html);
    var top = $(window).height() - this.cntr.height() - 50;
    var right = -(this.cntr.width());
    this.cntr.attr('style','right:' + right + 'px;top:' + top + 'px;');
    this.cntr.css({opacity:0});
    
    //console.info(this.content);
    
    var post = $('#sl-nbox-signpost');
    $(window).scroll(function(){
        //console.info(post.offset().top + " - " + $(window).height() + " = " + (post.offset().top - $(window).height()) + " <> " + $(window).scrollTop());
        if(post.offset().top - $(window).height() <= $(window).scrollTop()){
            this.sc.state.showBox();
        }
        if(post.offset().top - $(window).height() >= $(window).scrollTop()){
            this.sc.state.hideBox();
        }
    });
}
SlateNextBox.prototype.close = function(){
    $.cookie('sl-nbox-sleeping', 'true');
    $('#sl-nbox-cntr').animate({
        opacity:0,
        top:['+=200','easeInCirc']
    },'400', 'linear', function(){
        $(this).empty();
    });
}

function SlateNextBoxShell(){
    MYS.nboxShell = this;
    //console.info('[SlateNextBox] instantiated.');
    this.MYSLATE_URL = 'http://www.slate.com/myslate.html';
    this.treatment = ''
    this.clr = new Elm('div', {'class':'clearing'});
    this.nbox = new Elm('div', {'id':'sl-nbox'});
    this.top = new Elm('div');
    this.mid = new Elm('div');
    this.mbar = new Elm('div');
    this.leader = new Elm('span');
    this.close = new Elm('a');
    this.main = new Elm('div',{'class':'sl-nbox-tracker'});
    this.illoCntr = new Elm('div');
    this.illoLink = new Elm('a');
    this.illo = new Elm('img');
    this.body = new Elm('div');
    this.hed = new Elm('a');
    this.dek = new Elm('p');
    this.promo = new Elm('div');
    this.bot = new Elm('div');    
    this.html = this.nbox.append(
        this.top, 
        this.mid.append(
            this.mbar.append(
                this.leader,
                this.close.append('&#215;'),
                this.clr.clone(true)
            ),
            this.main.append(
                this.illoCntr.append(
                  this.illoLink.append(
                      this.illo
                  )  
                ),
                this.body.append(
                    this.hed,
                    this.dek,
                    this.promo
                ),
                this.clr.clone(true)
            )
        ), 
        this.clr.clone(true),
        this.bot
    );
    this.PROMO_DATA = {
        leader:'SIGN UP FOR MYSLATE',
        hed:'',
        dek:'MySlate is a tool that lets you track your favorite parts of Slate.',
        img:'http://www.slate.com/etc/designs/slate/images/myslate/mySlateLogo.png',
        illoLink:this.MYSLATE_URL,
        promo:'<a href="' + this.MYSLATE_URL + '">Click here to learn more!</a>'
    }
}
SlateNextBoxShell.prototype.addContent = function(data){
    var that = this;
    //25% of the time, override data passed in with promo for non-active users
    var ctrl = parseInt(Math.random()*4);    
    if(ctrl===0 && MYS.sc.state.name !== 'active' && MYS.sc.state.name !== 'queueless' ){
        data = this.PROMO_DATA;
        //tweak css if promo
        this.dek.css('font-size','13px');
        if(this.treatment === 'Dark'){
            this.dek.css('margin-top','13px');
        }
    }
    //click-tracking
    this.main.attr('track-data',function(){
        return '{"id":' + data.articleId + ',"module":"' + that.nbox.attr('track-module') + '"}';
    });
    
    //set content
    this.leader.append(data.leader);
    this.hed.append(data.hed);
    this.hed.attr({'href':data.url});
    this.dek.append(data.dek);
    this.promo.append(data.promo);
    if(data.img){
        this.illoLink.attr('href',data.illoLink);
        this.illo.attr({'src':data.img});
    }else{
        this.illoCntr.hide();
        this.body.css('width','100%');
    }
    this.close.attr({'href':'javascript:void(0)'});
    this.close.click(function(){
        MYS.nb.close()
    });
}

SlateNextBoxShell.factory = function (type){
    this.constr = type;
    this.newbox;
    
    //error if constructor doesn't exist
    if (typeof SlateNextBoxShell[this.constr] !== 'function'){
        throw ('Factory type, ' + this.constr + ", doesn't exist");
    }
    //constructor exists, inherit from parent, but only once
    if (typeof SlateNextBoxShell[this.constr].prototype.myFunction !== 'function'){
        SlateNextBoxShell[this.constr].prototype = new SlateNextBoxShell();
    }
    //create a new instance
    newbox = new SlateNextBoxShell[this.constr]();
    //optional init steps here then return
    newbox.treatment = this.constr;

    return newbox;
}
SlateNextBoxShell.Dark = function(){
    this.nbox.addClass('sl-nboxd');
    this.top.addClass('sl-nboxd-top');
    this.mid.addClass('sl-nboxd-mid');
    this.mbar.addClass('sl-nboxd-mbar');
    this.leader.addClass('sl-nboxd-leader');
    this.close.addClass('sl-nboxd-close');
    this.main.addClass('sl-nboxd-main');
    this.illoCntr.addClass('sl-nboxd-illo-cntr');
    this.illo.addClass('sl-nboxd-illo');
    this.body.addClass('sl-nboxd-body');
    this.hed.addClass('sl-nboxd-hed');
    this.dek.addClass('sl-nboxd-dek');
    this.bot.addClass('sl-nboxd-bot');

    this.nbox.attr('track-module','nextbox-a');
}
SlateNextBoxShell.DarkNarrow = function(){
    this.nbox.addClass('sl-nboxd');
    this.nbox.css({
        'width':'332px'
    });
    this.top.addClass('sl-nboxd-top');
    this.mid.addClass('sl-nboxd-mid');
    this.mbar.addClass('sl-nboxd-mbar');
    this.leader.addClass('sl-nboxd-leader');
    this.close.addClass('sl-nboxd-close');
    this.main.addClass('sl-nboxd-main');
    this.illoCntr.addClass('sl-nboxd-illo-cntr');
    this.illo.addClass('sl-nboxd-illo');
    this.body.addClass('sl-nboxd-body');
    this.body.css({
        'width':'174px'
    });
    this.hed.addClass('sl-nboxd-hed');
    this.dek.addClass('sl-nboxd-dek');
    this.bot.addClass('sl-nboxd-bot');

    this.nbox.attr('track-module','nextbox-a');
}
SlateNextBoxShell.Light = function(){
    this.nbox.addClass('sl-nbox');
    this.top.addClass('sl-nbox-top');
    this.mid.addClass('sl-nbox-mid');
    this.mbar.addClass('sl-nbox-mbar');
    this.leader.addClass('sl-nbox-leader');
    this.close.addClass('sl-nbox-close');
    this.main.addClass('sl-nbox-main');
    this.illoCntr.addClass('sl-nbox-illo-cntr');
    this.illo.addClass('sl-nbox-illo');
    this.body.addClass('sl-nbox-body');
    this.hed.addClass('sl-nbox-hed');
    this.dek.addClass('sl-nbox-dek');
    this.bot.addClass('sl-nbox-bot');
    
    this.nbox.attr('track-module','nextbox-b');
}

// Follows a Factory Pattern which is tied to a State Machine w/ the different
// factory constructors matching the names of various states (see props of 
// MYS.StateController e.g. 'active', 'visiting', etc.)
function SlateNextBoxContent(){
}
SlateNextBoxContent.factory = function (type){
    this.constr = type;
    this.newcontent;
    
    //error if constructor doesn't exist
    if (typeof SlateNextBoxContent[this.constr] !== 'function'){
        throw ('Content Factory type, ' + this.constr + ", doesn't exist");
    }
    //constructor exists, inherit from parent, but only once
    if (typeof SlateNextBoxContent[this.constr].prototype.myFunction !== 'function'){
        SlateNextBoxContent[this.constr].prototype = new SlateNextBoxContent();
    }
    //create a new instance
    newcontent = new SlateNextBoxContent[this.constr]();
    //optional init steps here then return
    //console.info('[SlateNextBoxContent factory] ' + this.constr);

    return newcontent;
}
SlateNextBoxContent.visiting = function(){
    var obj = {
        articleId:SlateNextbox.data.article_id,
        leader:'NEXT ITEM IN ' + SlateNextbox.data.section,
        hed:SlateNextbox.data.headline,
        dek:SlateNextbox.data.subhead,
        url:SlateNextbox.data.url,
        illoLink:SlateNextbox.data.url,
        img:SlateNextbox.data.image,
        promo:  '<a href="http://www.slate.com/myslate.html" style="font-size:11px">'+
                'Sign up for MySlate to follow all ' + SlateNextbox.data.section + 
                ' stories.</a>'
    }
    return obj;
}
SlateNextBoxContent.uninitiated = function(){
    var obj = {
        articleId:SlateNextbox.data.article_id,
        leader:'NEXT ITEM IN ' + SlateNextbox.data.section,
        hed:SlateNextbox.data.headline,
        dek:SlateNextbox.data.subhead,
        url:SlateNextbox.data.url,
        illoLink:SlateNextbox.data.url,
        img:SlateNextbox.data.image,
        promo:  '<a href="http://www.slate.com/myslate.html" style="font-size:11px">'+
                'Sign up for MySlate to follow all ' + SlateNextbox.data.section + 
                ' stories.</a>'
    }
    return obj;
}
SlateNextBoxContent.inactive = function(){
    var obj = {
        articleId:SlateNextbox.data.article_id,
        leader:'NEXT ITEM IN ' + SlateNextbox.data.section,
        hed:SlateNextbox.data.headline,
        dek:SlateNextbox.data.subhead,
        url:SlateNextbox.data.url,
        illoLink:SlateNextbox.data.url,
        img:SlateNextbox.data.image,
        promo:  '<a href="http://www.slate.com/myslate.html" style="font-size:11px">'+
                'Sign up for MySlate to follow all ' + SlateNextbox.data.section + 
                ' stories.</a>'
    }
    return obj;
}
SlateNextBoxContent.active = function(){
    //console.info('ACTIVE');
    var obj;
    var that = this;
    this.checked = false;
    this.subDisplayName;
    this.subType;
    //determine if subscription should be a blog or article (via section)  
    if(MYS.userData.queue.articles[0].fields.blogs.length > 0){
        this.subDisplayName = MYS.userData.queue.articles[0].fields.blogs[0];
        this.subType ='blog';
    }
    else{
        this.subDisplayName = MYS.userData.queue.articles[0].fields.sections[0];
        this.subType ='section';
    }
    this.labels = {
        saved:'You are subscribed to <i>'+ this.subDisplayName + '</i>.',
        unsaved:'Follow all <i>' + this.subDisplayName + '</i> stories on MySlate.'
    }
    this.promoCntr = new Elm('div',{'class':'sl-nbox-cb-cntr'});
    this.subCBox = new Elm('input', {'type':'checkbox','class':'sl-nbox-cb'});
    this.subCBoxLabel = new Elm('span',{'class':'sl-nbox-cb-label'});
    
    MYS.userData.subscriptions.forEach(function(d){
        if(d.display_name == that.subDisplayName){
            that.checked = true;
            return;
        }
    });
    // MANAGING CB STATES IN CONDITIONALS HERE. TOO SMALL TO MERIT A FULL-BLOWN 
    // STATE MACHINE.
    if(this.checked){
        this.subCBox.attr('checked','checked');
        this.subCBoxLabel.html(this.labels.saved);
    }else{
        this.subCBoxLabel.html(this.labels.unsaved);
    }        
    this.subCBox.click(function(){
        that.toggleSubscription();
    });
    
    obj = {
        articleId:MYS.userData.queue.articles[0].fields.articleId,
        leader:'NEXT ITEM IN YOUR MYSLATE QUEUE',
        hed:MYS.userData.queue.articles[0].fields.hed,
        dek:MYS.userData.queue.articles[0].fields.dek,
        url:MYS.userData.queue.articles[0].fields.url.replace("mobile.slate.com", "www.slate.com"),
        illoLink:MYS.userData.queue.articles[0].fields.url.replace("mobile.slate.com", "www.slate.com"),
        img:MYS.userData.queue.articles[0].fields.thumbnail.replace("thumbnail-small", "rectangle-small"),
        promo:this.promoCntr.append(this.subCBox,this.subCBoxLabel)
    }
    return obj;
}
SlateNextBoxContent.queueless = function(){
    //console.info('QUEUELESS');
    var that = this;
    var obj;
    this.checked = false;
    this.subDisplayName = SlateNextbox.data.section;
    this.subType = SlateNextbox.data.subscribe_type;
    this.labels = {
        saved:'You are subscribed to <i>'+ this.subDisplayName + '</i>.',
        unsaved:'Follow all <i>' + this.subDisplayName + '</i> stories on MySlate.'
    }
    this.promoCntr = new Elm('div',{'class':'sl-nbox-cb-cntr'});
    this.subCBox = new Elm('input', {'type':'checkbox','class':'sl-nbox-cb'});
    this.subCBoxLabel = new Elm('span',{'class':'sl-nbox-cb-label'});
    this.subCBoxLabel.html('Follow all <i>' + this.subDisplayName + '</i> stories on MySlate.');
    
    this.subCBox.click(function(){
        that.toggleSubscription();
    });
    
    obj = {
        articleId:SlateNextbox.data.article_id,
        leader:'NEXT ITEM IN ' + SlateNextbox.data.section,
        hed:SlateNextbox.data.headline,
        dek:SlateNextbox.data.subhead,
        url:SlateNextbox.data.url,
        illoLink:SlateNextbox.data.url,
        img:SlateNextbox.data.image,
        promo:this.promoCntr.append(this.subCBox,this.subCBoxLabel)
    }
    return obj;
}
SlateNextBoxContent.loading = function(){
    var obj = {
        leader:'',
        hed:'',
        dek:'',
        url:'',
        img:'',
        promo:''
    }
    return obj;
}
SlateNextBoxContent.prototype.toggleSubscription = function(){
    var that = this;
    this.subCBoxLabel.fadeOut('fast',function(){
        if(that.checked){
            //SEND REQUEST TO UNSAVE
            $.ajax({
                url: 'http://my.slate.com' + '/users/unsubscribe/',
                data: {
                    type:that.subType,
                    display_name:that.subDisplayName
                },
                dataType: 'jsonp',
                success:function(){
                    that.subCBoxLabel.html(that.labels.unsaved);
                    that.checked = false;                        
                    that.subCBoxLabel.fadeIn('fast');
                },
                error:function(){
                    that.subCBoxLabel.html('<span style="color:#600;">There was an error processing your removal.</span>');
                    that.subCBoxLabel.fadeIn('fast');
                }
            });
        }
        else{
            //SEND REQUEST TO SAVE
            $.ajax({
                url: 'http://my.slate.com' + '/users/subscribe/',
                data: {
                    type:that.subType,
                    display_name:that.subDisplayName
                },
                dataType: 'jsonp',
                success:function(){
                    that.subCBoxLabel.html(that.labels.saved);
                    that.checked = true;                        
                    that.subCBoxLabel.fadeIn('fast');
                },
                error:function(){
                    that.subCBoxLabel.html('<span style="color:#600;">There was an error processing your save.</span>');
                    that.subCBoxLabel.fadeIn('fast');
                }
            });
            that.subCBoxLabel.html(that.labels.saved);
            that.subCBoxLabel.fadeIn('fast');
            that.checked = true;
        }    
    })
}

/*
    for more info, see mys-state-controller.js
    states are:
        1. open:nextbox is open
        2. closed:nextbox is closed
        3. sleeping:user clicked the close button which stores a session cookie
           that supresses the nextbox
        4. init state: before the box is ever viewed, inits the first slide in
*/
SlateNextBox.StateController = function(){
    //console.info('[SlateNextBox.StateController instantiated]');
    this.NEXT_BOX_STATE_CHANGED = "nextBoxStateChanged";
    this.init = new SlateNextBox.InitState(this);
    this.open = new SlateNextBox.OpenState(this);
    this.closed = new SlateNextBox.ClosedState(this);
    this.sleeping = new SlateNextBox.SleepingState(this);

    //default state
    if($.cookie('sl-nbox-sleeping')=='true'){
        this.setState(this.sleeping);
    }
    else{
        this.setState(this.init);
    }
    //for TESTING
    //this.setState(this.closed);
}
SlateNextBox.StateController.prototype.setState = function(s){
    //console.info('[MYS.StateController setState] ' + s.name);
    //console.info(s);
    var that = this;
    this.state = s;
    
    //DISPATCH EVENT
    Dispatcher.nextBoxStateChanged.deliver({
        type:this.NEXT_BOX_STATE_CHANGED,
        target:that.state
    });
}

//State functions to implement
/*
    function showBox();
    function hideBox();
*/

// OpenState Implementation
SlateNextBox.OpenState = function(c){
    this.controller = c;
    this.name = 'open';
}
SlateNextBox.OpenState.prototype.showBox = function(){
    //cannot showBox while in OpenState, box already showing
}
SlateNextBox.OpenState.prototype.hideBox = function(){
    var cntr = $('#sl-nbox-cntr');
    cntr.animate({
        right:-(cntr.width()),
        opacity:0
    },
    'fast');
    this.controller.setState(this.controller.closed);
}

// ClosedState Implementaion
SlateNextBox.ClosedState = function(c){
    this.controller = c;
    this.name = 'closed';
}
SlateNextBox.ClosedState.prototype.showBox = function(){
    var cntr = $('#sl-nbox-cntr');
    cntr.animate({
        right:30,
        opacity:1
    },
    'fast');
    this.controller.setState(this.controller.open);
}
SlateNextBox.ClosedState.prototype.hideBox = function(){
    //Cannot hideBox from ClosedState, box already hidden
}

// Sleeping State Implementation
SlateNextBox.SleepingState = function(c){
    this.controller = c;
    this.name = 'sleeping';
}
SlateNextBox.SleepingState.prototype.showBox = function(){
    //Can't do anything. In SleepingState.
}
SlateNextBox.SleepingState.prototype.hideBox = function(){
    //Can't do anything. In SleepingState.
}

// InitState Implementaion
SlateNextBox.InitState = function(c){
    this.controller = c;
    this.name = 'init';
}
SlateNextBox.InitState.prototype.showBox = function(){
    $('#sl-nbox').parent().track();
    var cntr = $('#sl-nbox-cntr');
    cntr.animate({
        right:30,
        opacity:1
    },
    'fast');
    this.controller.setState(this.controller.open);
}
SlateNextBox.InitState.prototype.hideBox = function(){
    //Cannot hideBox from InitState, box already hidden
}


function Elm(elm, attr){
    /*
     * @elm = String of element name
     * @attr = Object of attributes
     * 
     */
    this.elm = $(document.createElement(elm));
    
    if(attr){
        this.elm.attr(attr);
    }
    
    return this.elm;
}