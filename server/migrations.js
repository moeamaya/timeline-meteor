Migrations.add({
  version: 1,
  name: 'Adds days to all lists',
  up: function() {
    Lists.find().forEach(function (list) {
      var dots = Dots.find({listId: list._id});
      var count = dots.count();
      Lists.update(list._id, {$set: {days: count}});
    });
  },
  down: function() {
    Lists.find().forEach(function (list) {
      Lists.update(list._id, {$unset: {days : "" }});
    }); 
  }
});

Migrations.add({
  version: 2,
  name: 'Adds milestone to all todos',
  up: function() {
    Todos.find().forEach(function (todo) {
      if (todos.milestone != true) {
        Todos.update(todo._id, {$set: {milestone: false}});
      }
    });
  },
  down: function() {
    Todos.find().forEach(function (todo) {
      Todos.update(todo._id, {$unset: {milestone : "" }});
    }); 
  }
});