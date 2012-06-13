/*  Using the Observer design pattern to handle custom events. In this version, 
 *  we're using the Publisher/Subscriber metaphor and having eventHandlers 
 *  subscribe themselves to the publishers (versus the other way around). 
 *  Subscribers are analogous to eventHandlers while Publishers are analogous 
 *  to events. For example:
 *      this.eventHandlerFunction.subscribe(Dispatcher.eventToListenFor)
 *
 *  Or disptach events like so:
 *      Dispatcher.eventToListenFor.deliver([{some_obj}])
 *
 *  Note: Publisher.deliver()'s arg is optional, but should have at least a 
 *  'type' which is a string of the Dispatcher's props (eg 'stateChanged') and 
 *  'target' which is usually the object that initiates the delivery.
 */

// Publishers
// global obj, referencing pubs as dispatchers
var Dispatcher = {};
// dynamically create Dispatcher publishers from this array
var dispatcherEvents = [
    'activityStreamReady',
    'dashboardInit',
    'dashboardReady',
    'isUserAPISuccess',
    'mySlateLoaded',
    'newUserAPISuccess',
    'userAjaxComplete',
    'userTouched',
    'userUpdateAPISuccess',
    'stateChanged',
    'nextBoxStateChanged'
]
for(var d in dispatcherEvents){
    Dispatcher[dispatcherEvents[d]] = new Publisher();
}

// Abstract Observer Functions
function Publisher(){
    this.subscribers = [];
    return this;
}
Publisher.prototype.deliver = function(data){
    // @data should have at least 2 properties, simliar to event: type & target
    this.subscribers.forEach(
        function(fn){
            //console.info(fn);
            fn(data);
        }
    );
    // Returning 'this' at the end of the deliver method allows us to take
    // advantage of the 'chaining' technique.
    return this;
}
Function.prototype.subscribe = function(publisher){
    // for using 'this' within a closure
    var that = this; 
    // Function 'some' returns Boolean true if any of the callbacks return true. 
    var alreadyExists = publisher.subscribers.some(
        function(el){
            if(el === that){
                return;
            }
        }
    );
    if(!alreadyExists){
        publisher.subscribers.push(this);
    }
    // Remember to return 'this' for chaining later on.
    return this;
}
Function.prototype.unsubscribe = function(publisher){
    // for using 'this' within a closure
    var that = this;
    publisher.subscribers = publisher.subscribers.filter(
        function(el){
            if(el !== that){
                return el;
            }
        } 
    );
    // Remember to return 'this' for chaining later on.
    return this;
} 

