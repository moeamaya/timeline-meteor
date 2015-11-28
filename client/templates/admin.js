 Meteor.subscribe('allUsers')

Template.admin.onCreated(function() {
  
});

Template.admin.helpers({
  userCount: function() {
    return Meteor.users.find().count();
  },
  allUsers: function () {
    return Meteor.users.find();
  },
  userEmail: function() {
    return this.emails[0].address;
  }
});

Template.admin.events({

});
