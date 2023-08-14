var egg = new Egg();
egg
  .addCode("up,up", function() {
    $('body').terminal(
      {
        greetings: 'My First Web Terminal'
      });
  })
  .addHook(function(){
    console.log("Hook called for: " + this.activeEgg.keys);
    console.log(this.activeEgg.metadata);
  }).listen();
