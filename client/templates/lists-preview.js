var EDITING_KEY = 'editingList';
Session.setDefault(EDITING_KEY, false);

var EDITING_ITEM = 'editingItem';
Session.setDefault(EDITING_ITEM, false);



// Track if this is the first time the list template is rendered
var firstRender = true;
var listRenderHold = LaunchScreen.hold();
listFadeInHold = null;


Meteor.subscribe("dots");
Meteor.subscribe("todos");


Template.listsPreview.onCreated(function(){
  this.monthView = [];
});




Template.listsPreview.helpers({

  date: function(dot){
    var dot = Dots.findOne({_id: dot});
    return moment(dot.date).format('MMM Do');
  },

  dots: function(listId) {
    if (listId) {
      return Dots.find({listId: listId._id});  
    }
  },

  todosReady: function() {
    return Router.current().todosHandle.ready();
  },

  todos: function(listId) {
    return Todos.find({listId: listId}, {sort: {createdAt : -1}});
  },

  items: function(dotId){
    return Todos.find({dotId: dotId});
  },

  formattedDate: function(date) {
    var monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"
    ];
    var days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    var today = new Date();
    var current = new Date(date);
    var currentRound = new Date(date);
    var past = '';
    var day = current.getDay();
    var month = monthNames[current.getMonth()];
    var todayText = '';

    var isToday = (today.toDateString() == current.toDateString());

    // Bump current +24hours to get correct comparison 
    currentRound.setDate(current.getDate() + 1);
    if (currentRound <= today) {
      past += 'past ';
    }
    if (day == 0 || day == 6) {
      past += 'weekend ';
    }
    if (isToday) {
      todayText += '<span class="today">Today</span>'
    }

    return Spacebars.SafeString('<span class="' + past + '">' + todayText + days[day] + ' ' + month + ' ' + current.getDate() + '</span>');
  },

  formattedDot: function(date) {
    var today = new Date();
    var current = new Date(date);
    var day = current.getDay();

    var past = '';

    // Bump current +24hours to get correct comparison 
    current.setDate(current.getDate() + 1);
    if (current < today) {
      past += 'past ';
    }

    return Spacebars.SafeString('<div class="circle js-todo-add ' + past + '">' + '</div>');
  },
  userEmail: function(user) {
    var owner = Meteor.users.findOne({'_id': user});
    if (owner) {
      return owner.emails[0].address;
    } else {
      return '';
    }
  },
  monthTitle: function(dot) {
    var dot = Dots.findOne({_id: dot});
    var month = moment(dot.date).format('MMM');
    var temp = Template.instance().monthView;
    if (_.contains(temp, month)){
      return;
    } else {
      console.log('printing...')
      temp.push(month);
      Template.instance().monthView = temp;
      return Spacebars.SafeString('<h3 class="preview-month-title">' + month + '</h3>');
    }
    
  }

});








Template.listsPreview.events({





});
