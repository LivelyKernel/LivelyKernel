module('lively.morphic.tools.HelpMenuBarEntry').requires("lively.morphic.tools.MenuBar").toRun(function() {

lively.BuildSpec('lively.morphic.tools.HelpMenuBarEntry', lively.BuildSpec("lively.morphic.tools.MenuBarEntry").customize({

  name: "HelpMenuBarEntry",
  menuBarAlign: "left",
  textString: "help",

  style: lively.lang.obj.merge(lively.BuildSpec("lively.morphic.tools.MenuBarEntry").attributeStore.style, {
    extent: lively.pt(60,22),
    toolTip: "Help Commands"
  }),

  morphMenuItems: function morphMenuItems() {
    
    function cmd(name) { return function() { lively.ide.commands.exec(name); }; }
    
    var optArray = [
            ['Post Question',function(){
                //show('Replace with Post Questions Dialog')
                if (window.location.href.search('/questions/') == -1){
                    lively.PartsBin.getPart('QuestionJournalMorph','PartsBin/MattH',function(err,part){
                        if(err){
                            show('Error opening part: ' + err)
                        }
                        if(part){
                            part.openInWorld(lively.pt(100,100))
                        }
                    })    
                } else {
                    alert('Cannot submit question from question or answer world')
                } 
                
            }],
            ['View My Questions',function(){
                    lively.PartsBin.getPart('GetQuestionsDialog','PartsBin/MattH',function(err,part){
                    if(err){
                        show('Error opening part: ' + err)
                    }
                    if(part){
                        part.users = 'self'
                        part.openInWorld(lively.pt(200,200))
                    }
                })
            }
            
            ],
            ['View All Questions',function(){
                    lively.PartsBin.getPart('GetQuestionsDialog','PartsBin/MattH',function(err,part){
                    if(err){
                        show('Error opening part: ' + err)
                    }
                    if(part){
                        part.users = 'all'
                        part.openInWorld(lively.pt(200,200))
                    }
                })
            }]
            
            
            
    ];
    
    /*
    If world is a question, allow answers to be submitted and answers viewed
    */
    
    if (window.location.href.search('/questions/') != -1){
                        
                        
                        if(window.location.href.search('_answer_') == -1){
                        optArray.push(['--------------------',function(){}],
                        ['Submit Answer',function(){
                    if (window.location.href.search('/questions/') == -1){
                        alert("Error: This world is not in questions")
                        return
                    } 
                
                    lively.PartsBin.getPart('SubmitDialog','PartsBin/MattH',function(err,part){
                    if(err){
                        show('Error opening part: ' + err)
                    }
                    if(part){
                        part.users = 'all'
                        part.openInWorld(lively.pt(200,200))
                    }
                })
            }],
            ['View Answers',function(){
                lively.PartsBin.getPart('AnswersDialog','PartsBin/MattH',function(err,part){
                    if(err){
                        show('Error opening part: ' + err)
                    }
                    if(part){
                        part.openInWorld(lively.pt(200,200))
                    }
                })
            }]
            
            )} 
            
                        
                    }
    return optArray
  },

 update: function update() {},
  
}));



Object.extend(lively.morphic.tools.HelpMenuBarEntry, {

  getMenuBarEntries: function() {
    return [lively.BuildSpec('lively.morphic.tools.HelpMenuBarEntry').createMorph()]
  }
});



}) // end of module
