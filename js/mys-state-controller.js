/*  
  This State Machine is currently tracking user states, driven by the
  my.slate.com/users/is_user/ service:

    1. Visiting state (user not logged in)
            callback({
               "is_user": "Unknown", 
               "message": "No wapo_login_id cookie set."
           }) 
    2. Uninitiated state (user is logged in, but has not signed up for MySlate)
            callback({
                "is_user": true
            })
    3. Inactive state (user is logged in, but has a deactivated MySlate acct.)
            callback({
                "active": false, 
                "is_user": true
            })
    4. Active state (user is logged in, and has an active MySlate acct., and items in queue)
            callback({
                "active": true, 
                "is_user": true
            })
    5. Queueless state (extends Active, has no items in queue)
    6. Loading state (while data's being fetched)
*/

function MYS(){
    //empty name-spacer
}
MYS.StateController = function(){
    //console.info('[StateContoller] instantiated');
    var that = this;
    this.STATE_CHANGED = "stateChanged";
    this.visiting = new MYS.VisitingState(this);
    this.uninitiated = new MYS.UninitiatedState(this);
    this.inactive = new MYS.InactiveState(this);
    this.active = new MYS.ActiveState(this);
    this.queueless = new MYS.QueuelessState(this);
    this.loading = new MYS.LoadingState(this);

    //determine current state
    this.getUserStatus();

    //jQuery event bindings
	$wpjQ(document).bind('wapoLogout', function(){
	    that.setState(that.visiting);
    });
    
    //Observer subscriptions
    this.handleUserStatus.subscribe(Dispatcher.isUserAPISuccess)
}
//so we can dispatch events when the state changes 
MYS.StateController.prototype.setState = function(s){
    //console.info('[MYS.StateController setState] ' + s.name);
    this.state = s;
    var that = this;
    
    //DISPATCH EVENT
    Dispatcher.stateChanged.deliver({
        type:this.STATE_CHANGED,
        target:that.state
    });
}
//check MySlate service for user
MYS.StateController.prototype.getUserStatus = function(){
    var that = this;
    $.ajax({
        url: 'http://my.slate.com' + '/users/is_user/',
        type: 'GET',
        format: 'json',
        contentType: 'application/json',
        dataType: 'jsonp',
        success:function(d){
            Dispatcher.isUserAPISuccess.deliver({
                type:'isUserAPISuccess',
                target:that,
                data:d
            });
        }        
    });
}
//evaluate data from getUserStatus to determine which state to set to
MYS.StateController.prototype.handleUserStatus = function(delivery){
    //console.info('[MYS.StateController handleUserStatus]');
    //console.info(delivery.data);
    var data = delivery.data;
    var target = delivery.target;
    if(data.is_user==="Unknown") {
        target.setState(target.visiting);
    }
    if(data.is_user===false && !data.active){
        target.setState(target.uninitiated);
    }
    if(data.is_user===true && data.active===false){
        target.setState(target.inactive);
    }
    if( data.is_user===true && data.active===true){
        target.setState(target.loading);
        $.ajax({
            url: 'http://my.slate.com' + '/users/slate_page_info/',
            type: 'GET',
            format: 'json',
            contentType: 'application/json',
            dataType: 'jsonp',
            success:function(d){
                MYS.userData = d.user;
                if(MYS.userData.queue.count > 0){
                    target.setState(target.active);
                }
                else{
                    target.setState(target.queueless);                    
                }
            }        
        });
    }
}

/*
The State pattern calls for the implementation of a State Interface. If JS had
Interfaces the implementations would look similar to below.  

These aren't being used for now, but may be useful on the MySlate user side. We
can't really do much about the Identity pieces (login & logout).

*/

//========================
// (imaginary) IUserState 
//========================
/*
  function login();
  function signup();
  function activate();
  function deactivate();
  function logout();

*/

//====================
// VisitingState 
//====================
MYS.VisitingState = function(c) {
    //console.info('VisitingState instantiated');
    this.name = 'visiting';
    this.controller = c;
}
MYS.VisitingState.prototype.login = function(){
    this.controller.setState(this.controller.known);
}
MYS.VisitingState.prototype.signup = function(){
    throw('VisitingState cannot signup.');
}
MYS.VisitingState.prototype.reactivate = function(){
    throw('VisitingState cannot reactivate.');
}
MYS.VisitingState.prototype.deactivate = function(){
    throw('VisitingState cannot deactivate.');
}
MYS.VisitingState.prototype.logout = function(){
    throw('VisitingState cannot logout.');
}

//====================
// UninitiatedState 
//====================
MYS.UninitiatedState = function(c) {
    //console.info('UninitiatedState instantiated');
    this.name = 'uninitiated';
    this.controller = c;    
}
MYS.UninitiatedState.prototype.login = function(){
    throw('UninitiatedState cannot log in twice');
}
MYS.UninitiatedState.prototype.signup = function(){
    this.controller.setState(this.controller.active);
}
MYS.UninitiatedState.prototype.reactivate = function(){
    throw('UninitiatedState cannot reactivate.');
}
MYS.UninitiatedState.prototype.deactivate = function(){
    throw('UninitiatedState cannot deactivate');
}
MYS.UninitiatedState.prototype.logout = function(){
    this.controller.setState(this.controller.visiting);
}

//====================
// InactiveState 
//====================
MYS.InactiveState = function(c) {
    //console.info('InactiveState instantiated');
    this.name = 'inactive';
    this.controller = c;
}
MYS.InactiveState.prototype.login = function(){
    throw('InactiveState cannot log in twice');
}
MYS.InactiveState.prototype.signup = function(){
    throw('InactiveState cannot sign up again');
}
MYS.InactiveState.prototype.reactivate = function(){
    throw('InactiveState cannot reactivate.');
}
MYS.InactiveState.prototype.deactivate = function(){
    throw('InactiveState already deactivated');
}
MYS.InactiveState.prototype.logout = function(){
    this.controller.setState(this.controller.visiting);
}

//====================
// ActiveState 
//====================
MYS.ActiveState = function(c) {
    //console.info('ActiveState instantiated');
    this.name = 'active';
    this.controller = c;
}
MYS.ActiveState.prototype.login = function(){
    throw('ActiveState cannot log in twice');
}
MYS.ActiveState.prototype.signup = function(){
    throw('ActiveState cannot sign up again');
}
MYS.ActiveState.prototype.reactivate = function(){
    throw('ActiveState cannot reactivate.');
}
MYS.ActiveState.prototype.deactivate = function(){
    this.controller.setState(this.controller.inactive);
}
MYS.ActiveState.prototype.logout = function(){
    this.controller.setState(this.controller.visiting);
}

//====================
// QueuelessState 
//====================
MYS.QueuelessState = function(c) {
    //console.info('Queueless instantiated');
    this.name = 'queueless';
    this.controller = c;
}
MYS.QueuelessState.prototype.login = function(){
    throw('Queueless cannot log in twice');
}
MYS.QueuelessState.prototype.signup = function(){
    throw('Queueless cannot sign up again');
}
MYS.QueuelessState.prototype.reactivate = function(){
    throw('Queueless cannot reactivate.');
}
MYS.QueuelessState.prototype.deactivate = function(){
    this.controller.setState(this.controller.inactive);
}
MYS.QueuelessState.prototype.logout = function(){
    this.controller.setState(this.controller.visiting);
}

//====================
// LoadingState 
//====================
MYS.LoadingState = function(c) {
    //console.info('LoadingState instantiated');
    this.name = 'loading';
    this.controller = c;
}
MYS.LoadingState.prototype.login = function(){
    throw('LoadingState cannot log in.');
}
MYS.LoadingState.prototype.signup = function(){
    throw('LoadingState cannot sign up.');
}
MYS.LoadingState.prototype.reactivate = function(){
    throw('LoadingState cannot reactivate.');
}
MYS.LoadingState.prototype.deactivate = function(){
    throw('LoadingState cannot deactivate.');
}
MYS.LoadingState.prototype.logout = function(){
    throw('LoadingState cannot logout.');
}
