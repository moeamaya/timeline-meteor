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


Template.listsShow.onCreated(function() {
  this.daysArray = [];
  this.milestoneClick = false;
});



Template.listsShow.onRendered(function() {
  var self = this;
  if (firstRender) {
    // Released in app-body.js
    listFadeInHold = LaunchScreen.hold();

    // Handle for launch screen defined in app-body.js
    listRenderHold.release();

    firstRender = false;
  }

  // create local days array
  var id = self.data._id;
  var dots = Dots.find({listId: id});
  dots.forEach(function(dot){
    self.daysArray.push(dot);
  });

  this.find('.js-title-nav')._uihooks = {
    insertElement: function(node, next) {
      $(node)
        .hide()
        .insertBefore(next)
        .fadeIn()
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        this.remove();
      });
    }
  };

  setTimeout(function(){
    // Scroll to Today
    $('.content-scrollable').animate({
      scrollTop: self.$(".today").position().top - 20
    }, 500);
  }, 100)
});



Template.listsShow.helpers({
  editing: function() {
    return Session.get(EDITING_KEY);
  },
  
  editingItem: function(item) {
    var sessionItem = Session.get(EDITING_ITEM);
    
    if (sessionItem == item) {
      return true;
    } else {
      return false;
    }
  },

  dots: function(list) {
    var dots = Dots.find({listId: list._id});
    // dots.forEach(function(dot){
    //   Template.instance().daysArray.push(dot);
    // });
    
    return dots
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

    var today = new Date(new Date().setHours(0, 0, 0, 0));
    var current = new Date(new Date(date).setHours(0, 0, 0, 0));
    var currentRound = new Date(new Date(date).setHours(0, 0, 0, 0));
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
  checkText: function(text) {
    if (/\S/.test(text)){
      return text;
    } else {
      return Spacebars.SafeString('<i>Add Text...</i>' )
    }
  },
  isChecked: function(value) {
    if (value === true) {
      return "checked";
    } else {
      return "";
    }
  }

});



var editList = function(list, template) {
  Session.set(EDITING_KEY, true);

  // force the template to redraw based on the reactive change
  Tracker.flush();
  template.$('.js-edit-form input[type=text]').focus();
};

var saveList = function(list, template) {
  Session.set(EDITING_KEY, false);
  Lists.update(list._id, {$set: {name: template.$('[name=name]').val()}});
}

var deleteList = function(list) {
  // ensure the last public list cannot be deleted.
  if (! list.userId && Lists.find({userId: {$exists: false}}).count() === 1) {
    return alert("Sorry, you cannot delete the final public list!");
  }

  var message = "Are you sure you want to delete the list " + list.name + "?";
  if (confirm(message)) {
    // we must remove each item individually from the client
    Todos.find({listId: list._id}).forEach(function(todo) {
      Todos.remove(todo._id);
    });
    Lists.remove(list._id);

    Router.go('home');
    return true;
  } else {
    return false;
  }
};

var toggleListPrivacy = function(list) {
  if (! Meteor.user()) {
    return alert("Please sign in or create an account to make private lists.");
  }

  if (list.userId) {
    Lists.update(list._id, {$unset: {userId: true}});
  } else {
    // ensure the last public list cannot be made private
    if (Lists.find({userId: {$exists: false}}).count() === 1) {
      return alert("Sorry, you cannot make the final public list private!");
    }

    Lists.update(list._id, {$set: {userId: Meteor.userId()}});
  }
};

var newItem = function($items) {
  var wrapper = $('<div class="item-show"></div>')
  var $itemInput = $('<input class="item js-item js-todo-new" type="text" placeholder="Add event...">');
  var $submitBtn = $('<div class="submit js-submit-item">&check;</div>');
  var $deleteBtn = $('<div class="delete js-delete-item">&times;</div>');

  wrapper
    .append($itemInput)
    .append($submitBtn)
    .append($deleteBtn)

  $items.append(wrapper);
  $itemInput.focus();
};

var editItem = function(item, template) {
  Session.set(EDITING_ITEM, item._id);

  // force the template to redraw based on the reactive change
  Tracker.flush();
  this.$('input[type=text]').focus();
};

var saveItem = function(item, template, text) {
  Session.set(EDITING_ITEM, false);

  Todos.update(item._id, {$set: {text: text}});
};

var deleteItem = function(item) {
  var message = "Are you sure you want to delete the item?";

  if (confirm(message)) {
    // we must remove each item individually from the client
    var dot = Dots.findOne({_id: item.dotId});
    
    Lists.update(dot.listId, {$inc: {incompleteCount: -1}});

    Todos.remove(item._id);
    return true;
  } else {
    return false;
  }
};




Template.listsShow.events({
  'click .js-cancel': function() {
    Session.set(EDITING_KEY, false);
  },

  'keydown .js-item': function(event) {
    // ESC
    if (27 === event.which) {
      event.preventDefault();
      $(event.target).blur();
    }
  },

  'blur input[type=text]': function(event, template) {
    // if we are still editing (we haven't just clicked the cancel button)
    if (Session.get(EDITING_KEY))
      saveList(this, template);
  },

  'submit .js-edit-form': function(event, template) {
    event.preventDefault();
    saveList(this, template);
  },

  // handle mousedown otherwise the blur handler above will swallow the click
  // on iOS, we still require the click event so handle both
  'mousedown .js-cancel, click .js-cancel': function(event) {
    event.preventDefault();
    Session.set(EDITING_KEY, false);
  },

  'change .list-edit': function(event, template) {
    if ($(event.target).val() === 'edit') {
      editList(this, template);
    } else if ($(event.target).val() === 'delete') {
      deleteList(this, template);
    } else {
      toggleListPrivacy(this, template);
    }

    event.target.selectedIndex = 0;
  },

  'click .js-edit-list': function(event, template) {
    editList(this, template);
  },

  'click .js-toggle-list-privacy': function(event, template) {
    toggleListPrivacy(this, template);
  },

  'click .js-delete-list': function(event, template) {
    deleteList(this, template);
  },



  'click .js-todo-add': function(event, template) {
    // Session.set(EDITING_ITEM, false);

    var $items = $(event.target).parents('.dot').find('.items');
    newItem($items);
  },

  'click .item-show': function(event, template) {
    editItem(this, template);
  },

  'blur .js-todo-new': function(event) {
    event.preventDefault();

    var $input = $(event.target);

    if ($input.val() == ""){
      $input.parent().remove();
      return;
    }

    Todos.insert({
      dotId: this._id,
      text: $input.val(),
      createdAt: new Date(),
      milestone: false
    });

    Lists.update(this.listId, {$inc: {incompleteCount: 1}});

    var $items = $input.parents('.items');
    newItem($items);

    $input.parents('.item-show').remove();
  },

  'mousedown .delete': function(event, template) {
    event.preventDefault();
    
    deleteItem(this);
  },

  'mousedown .js-submit-item': function(event, template) {
    // console.log(event.target);
  },

  'mousedown .js-milestone': function(event) {
    Template.instance().milestoneClick = true;  
  },

  'change .js-milestone': function(event) {
    var id = this._id;
    var value = event.target.checked;
    Todos.update(id, {$set: {milestone: value}}); 
  },

  'blur .item': function(event, template) {
    event.preventDefault();

    if (Template.instance().milestoneClick) {
      Template.instance().milestoneClick = false;
      $(this).focus();
    } else {
      var text = event.target.value;  
      saveItem(this, template, text);
    }
  },

  'keydown .js-item': function(event, template) {
    // ESC or ENTER
    if (event.which === 27 || event.which === 13) {
      event.preventDefault();
      event.target.blur();
    }
    if (event.which === 13){
      var $items = $(event.target).parents('.dot').find('.items');
      newItem($items);
      event.target.blur();
    }
  },

  'submit .js-days-form': function(event) {
    event.preventDefault();

    var $input = $(event.currentTarget[0]);
    var prev = parseInt($input.attr('data-days'));
    var next = $input.val();
    // var daysArray = Template.instance().daysArray;
    var delta = next - prev;

    var check = prev + Math.abs(delta)

    if (prev > 90 || prev + delta > 90){
      var message = 'Sorry you can only create timelines of 90 days';
      alert(message);
      return;

    // Remove days from the timeline
    } else if (delta < 0) {
      var message = "Are you sure you want to delete " + Math.abs(delta) + " days?";
      if (confirm(message)) {
        var range = Math.abs(delta);
        for (i = 0; i < range; i++) {
          var day = Template.instance().daysArray.pop();
          var dotId = day._id;

          // we must remove each item individually from the client
          Dots.remove(dotId);
          Lists.update(day.listId, {$inc: {days: -1}});

          var todos = Todos.find({dotId: dotId});
          todos.forEach(function(todo){
            Lists.update(day.listId, {$inc: {incompleteCount: -1}});
            Todos.remove(todo._id);
          });
        }
      }

    // Add days to the timeline
    } else if (delta > 0) {
      var range = Math.abs(delta);
      var lastDay = Template.instance().daysArray[Template.instance().daysArray.length - 1].date;
      var first = new Date(new Date(lastDay).setHours(0, 0, 0, 0));

      for (var i = 0; i < range; i++) {
        var index = i + 1
        var day = new Date(first.getFullYear(), first.getMonth(), first.getDate() + index);
        var dot = {date: day, listId: this._id };
        dot._id = Dots.insert(dot);
        Template.instance().daysArray.push(dot);

        // update the list number of days
        Lists.update(this._id, {$inc: {days: 1}});
      };
    }
  }

});
