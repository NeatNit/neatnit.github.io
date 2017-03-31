"use strict";
var questions = [];

function LoadQuestions() {
    var existingtypes = {};
    var xml = new XMLHttpRequest();
    xml.open("GET", "TheoryExamHE.xml", true);
    xml.addEventListener("load", function () {

        var div = document.createElement("div");

        // get all questions:
        var items = xml.responseXML.getElementsByTagName('item');

        for (var i = 0; i < items.length; ++i) {
            var q = items.item(i);

            // Create my question object (no class because lazy)
            var question = {};
            question.wrongAnswers = [];

            for (var node = q.firstChild; node; node = node.nextSibling) {
                switch (node.nodeName) {
                    case "title":
                        question.title = node.textContent.replace(/^\d{1,4}. /, "");
                        question.number = node.textContent.match(/^\d{1,4}/)[0];
                        break;

                    case "category":
                        question.categeory = node.textContent;
                        break;

                    case "pubDate":
                        question.pubDate = node.textContent;
                        break;

                    case "description":
                        // Put the embedded HTML in a div so we can access it
                        div.innerHTML = node.textContent.replace(' src="', ' data-src="');  // replace src with data-src to stop the browser from downloading the images prematurely

                        // Grab answers
                        var answers = div.getElementsByTagName("li");

                        for (var aindex = 0; aindex < answers.length; ++aindex) {
                            var answer = answers.item(aindex);
                            var span = answer.firstChild;

                            if (span.id.substring(0, 13) === "correctAnswer")
                                question.correctAnswer = span.innerText;
                            else
                                question.wrongAnswers.push(span.innerText);
                        }

                        // Grab applicable license types
                        question.types = {};
                        var strs = div.innerText.match(/«([^«»]+)+»/g)
                        for (var stri = 0; stri < strs.length; stri++) {
                            var str = strs[stri];
                            str = str.substr(1, str.length - 2);
                            if (str === "В") str = "B"; // fucking russian bullshit
                            question.types[str] = true;
                            existingtypes[str] = true;
                        }

                        // Grab image if it exists
                        var img = div.getElementsByTagName("img");
                        if (img.length > 0)
                            question.image = img.item(0).getAttribute("data-src");

                        break;

                    default:
                        break;
                }
            }

            questions.push(question);
            div.remove();
        }

        var thebutton = document.getElementById("startbtn");
        var typesspan = document.getElementById("types");
        for (var str in existingtypes) {
            var typepicker = document.createElement("input");
            typepicker.setAttribute("type", "radio");
            typepicker.setAttribute("name", "licensetype");
            typepicker.value = str;
            typesspan.appendChild(typepicker);
            typesspan.appendChild(document.createTextNode(str + " |"));

            if (str === "B") {
                typepicker.checked = true;
            }
        }
        thebutton.onclick = StartTest;
        thebutton.textContent = "התחל מבחן";
    });
    xml.send();
}

window.onload = LoadQuestions;

function StartTest() {
    document.getElementById("types").style.display = 'none';
    document.getElementById('anscount').style.display = 'none';

    document.getElementById("questions").innerHTML = "";
    var type = document.querySelector('input[name="licensetype"]:checked').value;
    var myquestions = questions.filter(function (q) { return q.types[type]; });
    myquestions.sort(() => 0.5 - Math.random());

    for (var qi = 0; qi < Math.min(myquestions.length, 30) ; qi++) {
        var myquestion = myquestions[qi];
        //console.log(question);
        var questiondiv = document.createElement("div");
        questiondiv.appendChild(document.createTextNode(myquestion.title));

        if (myquestion.image) {
            var img = document.createElement('img');
            img.src = myquestion.image;
            img.style.display = 'block';
            img.style.padding = '10px';
            questiondiv.appendChild(img);
        }

        var rightanswerindex = Math.floor(Math.random() * (myquestion.wrongAnswers.length + 1));
        var wronganswertoinsertbefore = null;
        // Add all wrong answers to the question div
        for (var wa = 0; wa < myquestion.wrongAnswers.length; wa++) {
            var ansdiv = document.createElement("div");
            ansdiv.classList.add("incorrect");
            var pick = document.createElement("input");
            pick.setAttribute("type", "radio");
            pick.setAttribute("name", myquestion.number);
            ansdiv.appendChild(pick);
            ansdiv.appendChild(document.createTextNode(myquestion.wrongAnswers[wa]));
            questiondiv.appendChild(ansdiv);
            if (wa === rightanswerindex) wronganswertoinsertbefore = ansdiv;
        }

        // add right answer to div
        var correctanswer = document.createElement("div");
        correctanswer.classList.add("correct");
        pick = document.createElement("input");
        pick.setAttribute("type", "radio");
        pick.setAttribute("name", myquestion.number);
        correctanswer.appendChild(pick);
        correctanswer.appendChild(document.createTextNode(myquestion.correctAnswer));
        questiondiv.insertBefore(correctanswer, wronganswertoinsertbefore);

        document.getElementById("questions").appendChild(questiondiv);
        document.getElementById("questions").appendChild(document.createElement("hr"));
    }

    var thebutton = document.getElementById("startbtn");
    thebutton.innerText = "בדוק תשובות";
    thebutton.onclick = CheckAnswers;
}

function CheckAnswers() {
    var right = 0, wrong = 0;
    document.querySelectorAll('.incorrect input:checked').forEach(function (input) {
        wrong++;
        var ansDiv = input.parentElement;
        ansDiv.style.backgroundColor = "DarkSalmon";
        
        var qDiv = ansDiv.parentElement;
        qDiv.querySelector('.correct').style.backgroundColor = "ForestGreen";
    });

    document.querySelectorAll('.correct input:checked').forEach(function (input) {
        right++;
        var ansDiv = input.parentElement;
        ansDiv.style.backgroundColor = "GreenYellow";
    });

    document.getElementById("types").style.display = '';
    document.getElementById('anscount').style.display = '';
    document.getElementById('anscount').innerText = right + " תשובות נכונות, " + wrong + "תשובות שגויות";

    var thebutton = document.getElementById("startbtn");
    thebutton.innerText = "התחל מבחן חדש";
    thebutton.onclick = StartTest;
}
