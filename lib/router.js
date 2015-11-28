Router.configure({
  // we use the  appBody template to define the layout for the entire app
  layoutTemplate: 'appBody',

  // the appNotFound template is used for unknown routes and missing lists
  notFoundTemplate: 'appNotFound',

  // show the appLoading template whilst the subscriptions below load their data
  loadingTemplate: 'appLoading',

  // wait on the following subscriptions before rendering the page to ensure
  // the data it's expecting is present
  waitOn: function() {
    return [
      Meteor.subscribe('publicLists'),
      Meteor.subscribe('privateLists'),
      Meteor.subscribe('allLists')
    ];
  }
});

dataReadyHold = null;

if (Meteor.isClient) {
  // Keep showing the launch screen on mobile devices until we have loaded
  // the app's data
  dataReadyHold = LaunchScreen.hold();

  // Show the loading screen on desktop
  Router.onBeforeAction('loading', {except: ['join', 'signin', 'admin', 'listsPreview']});
  Router.onBeforeAction('dataNotFound', {except: ['join', 'signin', 'admin', 'listsPreview']});
}

Router.route('join');
Router.route('signin');
Router.route('admin', {
  action: function() {
    this.render();
  }
});


Router.route('listsShow', {
  path: '/lists/:_id',
  // subscribe to todos before the page is rendered but don't wait on the
  // subscription, we'll just render the items as they arrive
  // onBeforeAction: function () {
  //   this.todosHandle = Meteor.subscribe('todos', this.params._id);
  //   // this.todosHandle = Meteor.subscribe('todos', this.params._id);

  //   if (this.ready()) {
  //     // Handle for launch screen defined in app-body.js
  //     dataReadyHold.release();
  //   }
  // },
  data: function () {
    return Lists.findOne(this.params._id);
  },
  action: function () {
    this.render();
  }
});

Router.route('listsPreview', {
  path: '/preview/:_id/', 
  data: function () {
    return Lists.findOne(this.params._id);
  },
  action: function () {
    this.render();
  }
});


Router.route('home', {
  path: '/',
  action: function() {
    var user = Meteor.user();
    if (user) {
      Router.go('listsShow', Lists.findOne( {'userId': user._id} ));
    } else {
      Router.go('listsShow', Lists.findOne());
    }
  }
});



