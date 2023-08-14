var egg = new Egg();
egg.addCode("up,up", function() {
    $('body').terminal({
    hello: function(what) {
        this.echo('Hello, ' + what +
                  '. Wellcome to this terminal.');
    },
    cat: function() {
        this.echo($('<img src="https://placekitten.com/408/287">'));
    }
  }, {
    greetings: 'Relocation Services Command Line Terminal For Advanced Actions (RSCLTFAA)'
  });
})
  .addHook(function(){
    console.log("Hook called for: " + this.activeEgg.keys);
    console.log(this.activeEgg.metadata);
  }).listen();

$(document).ready(function() {
  $('a:contains("Launch Terminal")').click(function (){
    $('body').terminal({
    hello: function(what) {
        this.echo('Hello, ' + what +
                  '. Wellcome to the button terminal.');
    },
    cat: function() {
        this.echo($('<img src="https://placekitten.com/408/287">'));
    }
  }, {
    greetings: 'Button Terminal'
  });
  });
});

