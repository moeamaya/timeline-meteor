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


Template.listsShow.onRendered(function() {
  if (firstRender) {
    // Released in app-body.js
    listFadeInHold = LaunchScreen.hold();

    // Handle for launch screen defined in app-body.js
    listRenderHold.release();

    firstRender = false;
  }

  this.find('.js-title-nav')._uihooks = {
    insertElement: function(node, next) {
      $(node)
        .hide()
        .insertBefore(next)
        .fadeIn();
    },
    removeElement: function(node) {
      $(node).fadeOut(function() {
        this.remove();
      });
    }
  };
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

  dots: function(listId) {
    return Dots.find({listId: listId._id});
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
    var past = '';
    var day = current.getDay();
    var month = monthNames[current.getMonth()];

    if (current < today) {
      past += 'past';
    }
    if (day == 0 || day == 6) {
      past += 'weekend ';
    }

    return Spacebars.SafeString('<span class="' + past + '">' + days[day] + ' ' + month + ' ' + current.getDate() + '</span>');
  },

  formattedDot: function(date) {
    var today = new Date();
    var current = new Date(date);
    var day = current.getDay();

    var past = '';
    var weekend = '';

    if (current < today) {
      past += 'past ';
    }
    // if (day == 0 || day == 6) {
    //   weekend += 'weekend ';
    // }

    return Spacebars.SafeString('<div class="circle js-todo-add ' + past + weekend + '">' + '</div>');
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

  'keydown input[type=text]': function(event) {
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
    // consol
    // Session.set(EDITING_ITEM, false);

    var $this = $(event.target).parent().parent();
    var $items = $this.find('.items');
    var wrapper = $('<div class="item-show"></div>')
    var $itemInput = $('<input class="item js-todo-new" type="text" placeholder="Add event...">');

    $items.append(wrapper.append($itemInput));
    $itemInput.focus();
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
      createdAt: new Date()
    });

    Lists.update(this.listId, {$inc: {incompleteCount: 1}});

    $input.remove();
  },

  'mousedown .delete': function(event, template) {
    event.preventDefault();
    
    deleteItem(this);
  },

  'blur .item': function(event, template) {
    event.preventDefault();
    var text = event.target.value;
    saveItem(this, template, text)
  },

  'keydown input[type=text]': function(event) {
    // ESC or ENTER
    if (event.which === 27 || event.which === 13) {
      event.preventDefault();
      event.target.blur();
    }
  }

});
