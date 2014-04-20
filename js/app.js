App = Ember.Application.create({
  LOG_TRANSITIONS: true,
  LOG_TRANSITIONS_INTERNAL: true
});

App.Router.map(function() {
  this.resource('index', { path: '/' }, function() {
    this.resource('posts', { path: '/' });
    this.resource('post', { path: '/posts/:post_id' });
    this.resource('sample', { path: '/sample' });
    this.resource('new', { path: '/posts/new' });
    this.resource('tags', { path: '/tags/:tag_name' });
  });
});

App.ApplicationController = Ember.ObjectController.extend({
  url: 'https://script.google.com/macros/s/AKfycbzH3ZAwcL5U98fXeQtXo0WC-oGAlJt4KL2DmmNV4EA9cUBSLZw/exec', 

});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    return $.getJSON(this.controllerFor('application').get('url')).then(function(data) {      
      data.posts.forEach(function(post) {
        post.created = new Date(post.created).toLocaleString();
      });
      return data;
    });
  }
});

App.IndexController = Ember.ObjectController.extend({
  recent: function() {
    return this.get('model.posts').slice(0,3);
  }.property('recent'), 
  tags: function() {
    var tags = this.get('model.tags');
    return Object.keys(tags).map(function(tag) {
      return {name: tag, number: tags[tag]};
    });
  }.property('tags')
});

App.PostsRoute = Ember.Route.extend({
  model: function() {
    return this.modelFor('index').posts;
  }
});

App.TagsRoute = Ember.Route.extend({
  model: function(params) {
    return this.modelFor('index').posts.filter(function(post) {
      return post.tags.indexOf(params.tag_name) !== -1;
    });
  }
});

App.PostRoute = Ember.Route.extend({
  model: function(params) {
    var posts = this.modelFor('index').posts, 
        id = +params.post_id;
    for (var i = 0, len = posts.length; i < posts.length; i += 1) {
      if (posts[i].id === id) {
        return posts[i];
      }
    }
  }
});

App.PostController = Ember.ObjectController.extend({
  needs: 'new', 
  isEditing: false,
  actions: {
    edit: function() {
      this.set('isEditing', true);
    },
    save: function() {
      this.set('isEditing', false);
      this.get('controllers.new').send('save', this);
    }
  }
});

App.NewRoute = Ember.Route.extend({
  model: function() {
    return { title: '', created: new Date().toLocaleString(), author: '', href: '', tags: '', excerpt: '', body: '' };
  }
});

App.NewController= Ember.ObjectController.extend({  
  actions: {
    save: function(that) {
      var self = that || this;          
      $.ajax({ url: this.controllerFor('application').get('url'), 
        data: JSON.stringify(self.get('model')), 
        dataType: "json", 
        type: "POST", 
        crossDomain: true }).then(function(data, status) {          
          self.transitionToRoute('index').then(function () {
            location.reload(true);            
          });          
        }
      );
    }
  }
});

Ember.TextField.reopen({
  attributeBindings: ['class']
});

Ember.TextArea.reopen({
  attributeBindings: ['class']
});

var showdown = new Showdown.converter();

Ember.Handlebars.helper('format-markdown', function(input) {
  return new Handlebars.SafeString(showdown.makeHtml(input));
});