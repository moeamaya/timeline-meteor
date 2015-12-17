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