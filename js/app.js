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
    this.resource('archives', { path: '/archives/:year/:month' });
  });
});

App.ApplicationController = Ember.ObjectController.extend({  
  url: 'https://script.google.com/macros/s/AKfycbzH3ZAwcL5U98fXeQtXo0WC-oGAlJt4KL2DmmNV4EA9cUBSLZw/exec' 
});

App.IndexRoute = Ember.Route.extend({
  model: function() {
    var controller = this.controllerFor('index');
    return controller.posts('?limit=' + controller.get('limit'));
  }
});

App.IndexController = Ember.ObjectController.extend({
  limit: 5, 
  total: 0, 
  hasMore: true, 
  actions: { 
    more: function() {
      var model = this.get('model');;
      this.posts('?limit=' + this.get('limit') + '&offset=' + (this.get('total'))).then(function(data) {       
        data.posts.forEach(function(post) {
           model.posts.pushObject(post);
        });
      });
    }
  }, 
  posts: function(query) {
    var url = this.controllerFor('application').get('url') + query, 
        self = this;
    return $.getJSON(url).then(function(data) {
      data.posts.forEach(function(post) {
        post.date = new Date(post.created);
        post.created = post.date.toLocaleString();
      });
      var total = self.get('total') + data.posts.length;      
      if (total >= +data.meta.total) {
        self.set('hasMore', false);
      }
      self.set('total', total);
      return data;
    });
  }, 
  recent: function() {
    return this.get('model.posts').slice(0,5);
  }.property('recent'), 
  tags: function() {
    var tags = this.get('model.meta.tags');
    return Object.keys(tags).map(function(tag) {
      return {name: tag, number: tags[tag]};
    }).sort(function(a, b) {
      return b.number - a.number;
    });
  }.property('tags'), 
  archives: function() {
    var archives = this.get('model.meta.archives'), 
        self = this;
    return Object.keys(archives).map(function(month) {
      var arr = month.split('/');      
      return {
        year: arr[0], 
        monthNumber: arr[1], 
        monthName: self.getMonthName(arr[1]), 
        number: archives[month], 
        index: +(arr[0] + '.' + arr[1])
      };
    }).sort(function(a, b) {
      return b.index - a.index;
    });
  }.property('archives'), 
  getMonthName: function(n) {
    var m = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return m[n];
  }  
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

// App.TagsController = Ember.ObjectController.extend({
//   needs: 'index', 
//   filter: function() {
//     return this.get('controllers.index')
//   }
// });

App.ArchivesRoute = Ember.Route.extend({
  model: function(params) {
    return this.modelFor('index').posts.filter(function(post) {      
      return post.date.getFullYear() === +params.year && post.date.getMonth() === +params.month;
    });
  }
});

App.PostRoute = Ember.Route.extend({
  model: function(params) {
    var posts = this.modelFor('index').posts, 
        id = +params.post_id;
    for (var i = 0, len = posts.length; i < len; i += 1) {
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
      if (this.get('controllers.new').send('save', this)) {
        this.set('isEditing', false);
      }
    }
  }
});

App.NewRoute = Ember.Route.extend({
  model: function() {
    return { title: '', created: new Date().toLocaleString(), author: '', href: '', tags: '', excerpt: '', body: '' };
  }
});

App.NewController = Ember.ObjectController.extend({  
  actions: {
    save: function(that) {      
      var self = that || this;      
      if (!this.validator.validate(self.get('model'))) {
        return false; 
      }
      $.ajax({ 
        url: this.controllerFor('application').get('url'), 
        data: JSON.stringify(self.get('model')), 
        dataType: "json", 
        type: "POST", 
        crossDomain: true 
      }).then(function(data, status) {          
        self.transitionToRoute('index').then(function () {
          if (!that) {
            location.reload(true);
          }
          return true;
        });
      });
    }    
  }, 
  validator: {
    config: {
      title: {minLength: 5, maxLength: 100}, 
      author: {minLength: 5, maxLength: 100},
      excerpt: {minLength: 10, maxLength: 500}, 
      body: {minLength: 10, maxLength: 5000}, 
      href: {isUrl: false}
    },
    validate: function(data) {
      var self = this, valid = true, configProp, element;      
      for (var prop in data) {        
        if (this.config.hasOwnProperty(prop)) {          
          configProp = this.config[prop];
          Object.keys(configProp).forEach(function(method) {            
            element = $('.blog-post').find("label[for='" + prop + "']");
            element.find('span[for="' + method + '"]').remove();
            if (!self[method].validate(data[prop], configProp[method])) {              
              valid = false;
              element.append('<span class="err" for="' + method + '"><sup>&nbsp;*</sup>&nbsp;' + 
                self[method].message(configProp[method]) + '</sup></span>');
            }
          });
        }                
      }
      return valid;
    }, 
    minLength: {
      validate: function(data, length) {
        return data.length >= length;
      }, 
      message: function(length) {
        return 'should be at least ' + length + ' characters';
      }
    }, 
    maxLength: {
      validate: function (data, length) {
        return data.length <= length;
      }, 
      message: function(length) {         
        return 'should be less or equal ' + length + ' characters';
      }
    }, 
    isUrl: {
      validate: function(url, required) {
        if (!required && url.length === 0) {
          return true;
        }
        return url.match(/^(ht|f)tps?:\/\/[a-z0-9-\.]+\.[a-z]{2,4}\/?([^\s<>\#%"\,\{\}\\|\\\^\[\]`]+)?$/);
      }, 
      message: function() {
        return 'should be a valid url';
      }
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