//объявляем переменные
var div_name = "#board";
var pgn_state = 0;
var game_step = 0;
var load_pgn = undefined;
var win = 0;
var c = "";
var del = 0;
var turn, if_gameover, if_check, if_mate, if_stalemate, load_fen, board_arr;
var fen_array = [];
var pgn_array = [];
var pgn_history = []; //история нотации
var task = {};

var id = 0;
var old_pgn;
var pgnPosition;
var pgnArray = [];
var fenArray = [];

$("#win_information").hide();
$("#figure").hide();

function loadTest(num) { //#################### загрузка теста ####################
    var test_name = "test" + num + ".txt";
    var txt;
    $.ajax({
        url: "tests/" + test_name,
        async: false,
        success: function (data){
            txt = data;
        }
    });
    var obj = JSON.parse(txt);
    console.log(obj);
    
    //str = txt.split("\r\n");
    
    task.title = str[0];
    task.points = str[1];
    task.fen = str[2];
    task.steps = str[3].split(", ");

    //task.title = "Бабцик - Лидер, Оберхоф, 1999";
    //task.points = 3;
    //task.fen = "r2qr1k1/1Qp2ppp/p2p4/4b3/8/1PN5/P4PPP/2R1R1K1 b - - 0 1";
    //task.steps = "Bxc3, Rxe8+, Qxe8".split(", "); 
}

function PGN2() { //#################### НОТАЦИИ v2.0 ####################
    var parentDiv = "";
    var notationPCRE = "x";
    var pgnArrayPCRE = "y";
    var hooksFrom = "";

    if (old_pgn == null) {
        var notation = chess.pgn();
        old_pgn = chess.pgn();
    } else {
        var notation = chess.pgn().replace(old_pgn, "");
        old_pgn = chess.pgn();
    }
    if (pgnPosition != null && pgn_state == 1) {
        parentDiv = pgnPosition;
    }
    if (pgnPosition != null && pgn_state == 0) {
        parentDiv = id - 1;
    }

    console.log("--------- start ----------");
    console.log(fenArray);
    console.log(pgnArray);
    console.log(pgnPosition);
    console.log(parentDiv);
    console.log(pgnArray[parseInt(pgnPosition) + 1]);
    console.log(notation, pgnArray[parseInt(pgnPosition) + 1]);
    console.log("--------- end ----------");

    if (pgnArray[parseInt(pgnPosition) + 1] != undefined) {//проверяем - есть ли след за ткущим ход в истории от текущей позиции в нотации, заносим в переменную
        notationPCRE = notation.match(/[a-zA-Z0-9\+\#]{2,6}/);
        pgnArrayPCRE = pgnArray[parseInt(pgnPosition) + 1].match(/[a-zA-Z0-9\+\#]{2,6}/);
    }

    if (notationPCRE == null || notationPCRE[0] == pgnArrayPCRE[0]) {//текущий ход совпал со след. ходом в истории
        console.log("повтор!");
        pgnPosition++;
        pgn_state = 0;
    }
    if (notationPCRE != null && notationPCRE[0] != pgnArrayPCRE[0]) {//новый ход, текущий не совпал со след. в истории
        if (parentDiv == "") {//parenDiv равен пустоте, значит нотация без подвариантов
            $("#pgn2").append("<div id=\"" + id + "\" style=\"display: inline\"> " + notation + " </div>");
        }
        if (parentDiv != "") {//parenDiv определен, подвариант есть
            if (pgn_state == 1) {//пользователь нажал на что то в нотаци
                hooksFrom = " [ ";
                var tmp_text = $("#" + String(Number(parentDiv) + 1)).text();
                $("#" + String(Number(parentDiv) + 1)).text(" ] " + tmp_text);
                pgn_state = 0;
            }
            $("#" + parentDiv).after(hooksFrom + "<div id=\"" + id + "\" style=\"display: inline\"> " + notation + " </div>");
        }
        id++;
        pgnArray.push(notation);
        fenArray.push(chess.fen());
    }

    $(" #pgn2 > div").each(function (event) {
        $(this).unbind();
        $(this).mouseup(function () {
            $(" #pgn2 > div").removeClass("bg-warning");
            $(this).addClass("bg-warning");
            var step = $(this).attr("id");
            console.log("STEP ", step);
            console.log("ID ", id);
            console.log("LOAD ", fenArray[step]);
            chess.load(fenArray[step]);
            if (step != id - 1) {
                pgnPosition = step;
                pgn_state = 1
            }
            console.log(pgn_state);
            drawing_board();
            move();

        });
    });
}

function figureAnimation(figure, color, size, fromX, fromY, toX, toY, to) { //#################### анимация фишуры при ходе компьютера ####################
    var sq = chess.get(to);
    if (sq.type == figure && sq.color == color) {
        del = to;
    }
    $("#figure").attr("src", "img/figures/" + figure + color + ".png");
    $("#figure").attr("width", size - 5);
    $("#figure").attr("height", size - 5);
    $("#figure").css("left", fromX - (size / 2) + 2.5);
    $("#figure").css("top", fromY - (size / 2) + 2.5);
    $("#figure").show().animate({
        left: toX - (size / 2) + 2.5,
        top: toY - (size / 2) + 2.5
    }, 1000).fadeOut(50);
}

function arrowDraw(from, to, result) { //#################### рисование стрелки ####################
    //var result = result;
    var position_board = $("#board").position();
    var square_wh = $(window).width() / 8;

    $("#canvas").attr("width", $(window).width());
    $("#canvas").attr("height", $(window).width());
    $("#canvas_container").css("top", position_board.top + "px");

    //console.log($("#canvas").width());
    //console.log($("#canvas").height());
    //console.log($("#canvas_container").css("top"));
    //console.log(position_board, square_wh);

    var letters = {};
    letters.a = 1;
    letters.b = 2;
    letters.c = 3;
    letters.d = 4;
    letters.e = 5;
    letters.f = 6;
    letters.g = 7;
    letters.h = 8;
    if (from == undefined) {
        $("#canvas").hide();
    } else {
        $("#canvas").show();
        var x_start = (letters[from[0]] * square_wh) - (square_wh / 2);
        var y_start = ((9 - from[1]) * square_wh) - (square_wh / 2);
        var x_end = (letters[to[0]] * square_wh) - (square_wh / 2);
        var y_end = ((9 - to[1]) * square_wh) - (square_wh / 2);
        //console.log(x_start, y_start, x_end, y_end);

        var canvas = document.getElementById("canvas");
        c = canvas.getContext("2d"); //document.getElementById("canvas") ???
        c.clearRect(0, 0, canvas.width, canvas.height);
        c.strokeStyle = "#CD3749";
        c.fillStyle = "#CD3749";
        c.beginPath();
        c.arrow(x_start, y_start, x_end, y_end, [0, 5, -20, 5, -20, 15]);
        //c.arrow(225, 400, 225, 100, [0, 5, -20, 5, -20, 15]);
        c.fill();

        figureAnimation(result.piece, result.color, square_wh, x_start, y_start, x_end, y_end, to);

        $("#canvas").fadeIn(1000);
        $("#canvas").fadeOut(1000);

    }
}

function gameOver(why) {
    if (why == "wrong") { //неверный ход в задаче
        localStorage.task1_result = 0;

        $("#win_information").text("Задание выполнено не верно!");
        $("#win_information").toggleClass("alert-danger");
        $("#win_information").show();
        if (c != "") {
            c.clearRect(0, 0, canvas.width, canvas.height);
        }
        $("#canvas").show();
    }
    if (why == "good") {
        localStorage.task1 = task.points; //начисляем баллы
        localStorage.test1 += task.points; //добавляем к общему количеству баллов за тест

        $("#win_information").text("Задание выполнено верно! Поздравляем");
        $("#win_information").show();
        win = 1;

    }
}

function game(to) { //проверка хода пользователя
    var steps = task.steps.length - 1; //общее количество шагов в задаче
    //console.log("*** game() ***");
    console.log("STEPS ", steps);
    console.log("GAME STEPS ", game_step);
    //console.log(to);
    if (game_step % 2 == 0 && to != "pc") { //*************************** ход человека ***************************
        //console.log("*** USER STEP ***");
        //if (game_step != steps) {
        if (to == task.steps[game_step] && to != "pc") {
            if (game_step == steps) { //если ход верный и текущий шаг совпал с общим количеством шагов - ПОБЕДА
                gameOver("good");
            }
            game_step++;
            game("pc");
            //console.log("GOOD");
        } else {
            //console.log("WRONG");
            gameOver("wrong");
        }
        //} else { //все ответы верные
        //gameOver("good");
        //}
        //console.log("*** USER STEP END ***");
    } else { //*************************** ход компьютера ***************************
        //sleep(500);
        console.log("*** PC STEP ***");
        var result = chess.move(task.steps[game_step]);
        if (result) {
            PGN2();
            fen_array.push(chess.fen()); //добавляем в массив FEN каждого хода
            pgn_array.push(result.san); //добавляем в массив единичный PGN каждого хода
            pgn_history.push(chess.pgn()); //добавляем в массив PGN нотацию после каждого хода
            //console.log(pgn_history);
            arrowDraw(result.from, result.to, result);
            load_pgn = undefined;
            game_step++;
        } else {
            console.log("ERROR 2");
        }
        console.log("PC ", result);
        console.log("*** PC STEP END ***");
    }
    //console.log("*** game() END ***");
}

function drawing_board() { //рисуем доску
    //console.log("*** DRAWING BOARD ***");
    board_arr = chess.board();
    var square_wh = $(window).width() / 8;
    //console.log("SQUARE WIDTH " + square_wh);
    var color_w = "bg-light";
    var color_b = "bg-info";
    var color;
    var color_step = 1;
    var table = "<table class=\"chess_board\" border=\"0\" cellspacing=\"0\" cellpadding=\"0\">";
    var arrabc = ["a", "b", "c", "d", "e", "f", "g", "h"];
    var figure;
    var coordinates;
    var coord_abc = ["a", "b", "c", "d", "e", "f", "g", "h"];

    $("#title").text(task.title); //title

    $(div_name).html("");

    for (var y = 0; y <= 7; y++) { //abc
        table += "<tr>";
        if (color_step == 1) {
            color_step = 2;
        } else {
            color_step = 1;
        }
        for (var x = 0; x <= 7; x++) { //012
            if (color_step == 1) {
                color = color_b;
                color_step = 2;
            } else {
                color = color_w;
                color_step = 1;
            }
            if (board_arr[y][x] != null) { //если квадрат доски не пустой, читаем фигуру и формируем тег img
                var t = board_arr[y][x].type;
                var c = board_arr[y][x].color;
                if (t == "r") {
                    figure = "r" + c + ".png";
                } //rook
                if (t == "n") {
                    figure = "n" + c + ".png";
                } //knight
                if (t == "b") {
                    figure = "b" + c + ".png";
                } //bishop
                if (t == "q") {
                    figure = "q" + c + ".png";
                } //queen
                if (t == "k") {
                    figure = "k" + c + ".png";
                } //kong
                if (t == "p") {
                    figure = "p" + c + ".png";
                } //pawn

                var img = "<img src=\"img/figures/" + figure + "\" width=\"" + (square_wh - 5) + "\" height=\"" + (square_wh - 5) + "\">";
            } else {
                var img = "";
            }
            if (x == 0) { //coordinates 123 отрисовка координат цифровых
                if (y <= 7) {
                    coordinates = 8 - y;
                    if (y == 7) {
                        coordinates += "a";
                    }
                }
            } else if (y == 7) { //coordinates ABC отрисовка координат буквенных
                if (x <= 7) {
                    coordinates = coord_abc[x];
                }
            } else {
                coordinates = "";
            }
            table += "<td><div align=\"center\" id=\"" + arrabc[x] + (8 - y) + "\" class=\"" + color + " square\" style=\"width: " + square_wh + "px; height: " + square_wh + "px\">" + img + "<span>" + coordinates + "</span></div></td>";
        }
        table += "</tr>";
    }
    table += "</table>";
    $(div_name).append(table);

    //check game over
    if_gameover = chess.game_over();
    //шаг
    if_check = chess.in_check();
    //мат
    if_mate = chess.in_checkmate();
    //пат
    if_stalemate = chess.in_stalemate();

    var mess = "";
    if (if_gameover) {
        mess += "Игра окончена!";
    }
    if (if_check) {
        mess += " Шах!";
    }
    if (if_mate) {
        mess += " Мат!";
    }
    if (if_stalemate) {
        mess += " Пат!";
    }

    //$("#gameover > span").text(mess);
    //turn
    turn = chess.turn();
    if (turn == "b") {
        turn = "Ход черных";
    } else {
        turn = "Ход белых";
    }
    //$("#turn").text(turn);
    //PGN
    //PGN();

    //PGNLive();
    //WinPGN();
    //console.log("*** DRAWING BOARD END ***");
}

function move() {
    //console.log("*** MOVE ***");
    var from, to;
    var check = 0;

    $(div_name + " > table > tbody > tr > td > div").each(function (event) {
        $(this).mouseup(function () {
            $(this).removeClass("bg-light");
            $(this).removeClass("bg-info");
            $(this).addClass("bg-warning");
            var position = $(this).attr("id");

            check++;
            if (check == 1) { //первое нажатие
                from = position;
                console.log("from: " + from);
            }
            if (check == 2) { //второе нажатие
                to = position;
                console.log("to: " + to);
                var result = chess.move({ //ходим
                    from: from,
                    to: to,
                    promotion: "q"
                });

                if (result) {
                    PGN2();
                    fen_array.push(chess.fen()); //добавляем в массив FEN каждого хода
                    pgn_array.push(result.san); //добавляем в массив единичный PGN каждого хода
                    pgn_history.push(chess.pgn()); //добавляем в массив PGN нотацию после каждого хода
                    load_pgn = undefined;
                    //console.log("PGN_HISTORY", pgn_history);
                    //pgn_state = 0;
                    if (win == 0) {
                        game(result.san);
                    }
                }
                console.log("USER ", result);
                //console.log(board_arr);
                drawing_board();
                if (del != 0) {
                    $("#" + del + " > img").hide().delay(1000).fadeIn(50);
                    del = 0;
                }
                move();

                check = 0; //обнуляем нажатие
            }
        });
    });
    //console.log("*** MOVE END ***");
}

loadTest(1);

var chess = new Chess();
chess.load(task.fen);
//chess.load_pgn("1.e4 e5 2.Nf3 Nc6 3.Bc4 Bc5 4.b4 Bxb4 5.c3 Ba5");

drawing_board();
move();
arrowDraw()

$("#exit").click(function () {
    window.location = "select_tests2.html";
});