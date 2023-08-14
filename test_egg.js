var egg = new Egg();
egg
  .addCode("up,up", function() {
    alert("egged, from new file");
  })
  .addHook(function(){
    console.log("Hook called for: " + this.activeEgg.keys);
    console.log(this.activeEgg.metadata);
  }).listen();