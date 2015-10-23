Meteor.publish('publicLists', function() {
  return Lists.find({userId: {$exists: false}});
});

Meteor.publish('privateLists', function() {
  if (this.userId) {
    return Lists.find({userId: this.userId});
  } else {
    this.ready();
  }
});

// Meteor.publish('todos', function(dotId) {
//   check(dotId, String);

//   return Todos.find({dotId: dotId});
// });


Meteor.publish('todos', function(){
  return Todos.find({});
})

Meteor.publish('dots', function() {
  return Dots.find({});
});