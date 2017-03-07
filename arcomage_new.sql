-- phpMyAdmin SQL Dump
-- version 4.6.5.2
-- https://www.phpmyadmin.net/
--
-- Хост: 127.0.0.1:3306
-- Время создания: Фев 23 2017 г., 13:00
-- Версия сервера: 5.6.34
-- Версия PHP: 5.6.29

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- База данных: `arcomage`
--

DELIMITER $$
--
-- Процедуры
--
CREATE DEFINER=`root`@`%` PROCEDURE `proc1` ()  NO SQL
BEGIN

	SELECT * FROM ratingsearch;
    
END$$

CREATE DEFINER=`root`@`%` PROCEDURE `procedure1` (OUT `result` INTEGER)  BEGIN
    Declare vplayer_id1 integer;
    Declare vplayer_rating1 integer;
    Declare vdifference1 integer;

    Declare vplayer_id2 integer;
    Declare vplayer_rating2 integer;
    Declare vdifference2 integer;

    Declare done integer default 0;

    Declare ratingCursor1 Cursor for Select `player_id`,`player_rating`,`difference` FROM `ratingsearch` where 1;
    Declare ratingCursor2 Cursor for Select `player_id`,`player_rating`,`difference` FROM `ratingsearch` where 1;

    DECLARE CONTINUE HANDLER FOR SQLSTATE '02000' SET done=1;

    Open ratingCursor1;

    WHILE done = 0 DO
    FETCH ratingCursor1 INTO vplayer_id1,vplayer_rating1,vdifference1;

      Open ratingCursor2;

      WHILE done = 0 DO
        FETCH ratingCursor2 INTO vplayer_id2,vplayer_rating2,vdifference2;

        SELECT count(*) INTO result FROM card;

      END WHILE;

      Close ratingCursor2;
      SET done = 0;

    END WHILE;

    Close ratingCursor1;

  END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Структура таблицы `card`
--

CREATE TABLE `card` (
  `card_id` int(11) NOT NULL,
  `card_name` varchar(100) NOT NULL,
  `card_res1` int(11) NOT NULL DEFAULT '0',
  `card_res2` int(11) NOT NULL DEFAULT '0',
  `card_res3` int(11) NOT NULL DEFAULT '0',
  `card_endturn` int(11) NOT NULL DEFAULT '0',
  `card_self_tower_hp` int(11) NOT NULL DEFAULT '0',
  `card_enemy_tower_hp` int(11) NOT NULL DEFAULT '0',
  `card_self_wall_hp` int(11) NOT NULL DEFAULT '0',
  `card_enemy_wall_hp` int(11) NOT NULL DEFAULT '0',
  `card_self_hp` int(11) NOT NULL DEFAULT '0',
  `card_enemy_hp` int(11) NOT NULL DEFAULT '0',
  `card_self_res1` int(11) NOT NULL DEFAULT '0',
  `card_self_gen1` int(11) NOT NULL DEFAULT '0',
  `card_enemy_res1` int(11) NOT NULL DEFAULT '0',
  `card_enemy_gen1` int(11) NOT NULL DEFAULT '0',
  `card_self_res2` int(11) NOT NULL DEFAULT '0',
  `card_self_gen2` int(11) NOT NULL DEFAULT '0',
  `card_enemy_res2` int(11) NOT NULL DEFAULT '0',
  `card_enemy_gen2` int(11) NOT NULL DEFAULT '0',
  `card_self_res3` int(11) NOT NULL DEFAULT '0',
  `card_self_gen3` int(11) NOT NULL DEFAULT '0',
  `card_enemy_res3` int(11) NOT NULL DEFAULT '0',
  `card_enemy_gen3` int(11) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `card`
--

INSERT INTO `card` (`card_id`, `card_name`, `card_res1`, `card_res2`, `card_res3`, `card_endturn`, `card_self_tower_hp`, `card_enemy_tower_hp`, `card_self_wall_hp`, `card_enemy_wall_hp`, `card_self_hp`, `card_enemy_hp`, `card_self_res1`, `card_self_gen1`, `card_enemy_res1`, `card_enemy_gen1`, `card_self_res2`, `card_self_gen2`, `card_enemy_res2`, `card_enemy_gen2`, `card_self_res3`, `card_self_gen3`, `card_enemy_res3`, `card_enemy_gen3`) VALUES
(1, 'Плевок', 0, 0, 1, 1, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(2, 'Спустить собак', 0, 0, 2, 1, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(3, 'Обстрел', 0, 0, 4, 1, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(4, 'Артиллерия', 0, 0, 8, 1, 0, 0, 0, 0, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(5, 'Дракон', 0, 0, 12, 1, 0, 0, 0, 0, 0, -15, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(6, 'Строитель', 1, 0, 0, 1, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(7, 'Реконструкция', 3, 0, 0, 1, 0, 0, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(8, 'Улучшение', 12, 0, 0, 1, 0, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(9, 'Покраска', 2, 0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(10, 'Кирпич', 4, 0, 0, 1, 5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(11, 'Антипригар', 11, 0, 0, 1, 10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(12, 'Большая стройка', 21, 0, 0, 1, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(13, 'Волшебная повозка', 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(14, 'Прилив сил', 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 0),
(15, 'Портал в зверинец', 0, 4, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0),
(16, 'Разрушитель', 0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, -8, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(17, 'Сжигание маны', 0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -8, 0, 0, 0, 0, 0),
(18, 'Травля', 0, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -8, 0),
(19, 'Мастерская', 8, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(20, 'Башня волшебника', 0, 8, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0),
(21, 'Ветеринарка', 0, 0, 8, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0),
(22, 'Обвал', 6, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0, 0, 0, 0, 0),
(23, 'Отупление', 0, 6, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, 0),
(24, 'Открыть клетки', 0, 0, 6, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1),
(25, 'Перестройка', 9, 0, 0, 1, 10, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(26, 'Разбор', 13, 0, 0, 1, 10, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(27, 'Атака', 0, 0, 3, 1, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(28, 'Спустить', 0, 0, 8, 1, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(29, 'Подлая диверсия', 0, 0, 18, 1, 0, -10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(30, 'Большие генераторы', 10, 10, 10, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0),
(31, 'Генераторная диверсия', 9, 9, 9, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, -1, 0, 0, 0, -1, 0, 0, 0, -1),
(32, 'Буйный рост', 5, 5, 5, 1, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0, 8, 0, 0, 0),
(33, 'Упадок', 3, 3, 3, 1, 0, 0, 0, 0, 0, 0, 0, 0, -8, 0, 0, 0, -8, 0, 0, 0, -8, 0),
(34, 'Приватизация', 0, 10, 14, 1, 0, 0, 0, 0, 0, -10, 4, 0, -4, 0, 4, 0, -4, 0, 4, 0, -4, 0),
(35, 'Боль', 20, 20, 20, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, -1, 0, 1, 0, -1, 0, 1, 0, -1),
(36, 'Волк-механик', 10, 0, 22, 1, 0, 0, 0, 0, 0, -30, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(37, 'Бабах', 0, 16, 35, 1, 0, 0, 0, 0, 0, -40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(38, 'Отстроились', 34, 10, 0, 1, 20, 0, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(39, 'Магический завод', 0, 10, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(40, 'Магические темницы', 0, 10, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0),
(41, 'Завод', 12, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(42, 'Темница', 0, 0, 12, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0),
(43, 'Магичка', 0, 12, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0),
(44, 'Алхимия', 0, 0, 3, 1, 0, 0, 0, 0, 0, 0, 6, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(45, 'Ботва', 5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 10, 0, 0, 0),
(46, 'Огненный шар', 0, 3, 0, 1, 0, 0, 0, 0, 0, -3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(47, 'Метеорит', 0, 5, 0, 1, 0, 0, 0, 0, 0, -5, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(48, 'Водопад', 0, 9, 0, 1, 0, 0, 0, 0, 0, -8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(49, 'Глыба', 0, 14, 0, 1, 0, 0, 0, 0, 0, -13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(50, 'Метелица', 0, 18, 0, 1, 0, 0, 0, 0, 0, -17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(51, 'Робот', 3, 0, 0, 1, 0, 0, 0, 0, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(52, 'Механическая рука', 5, 0, 0, 1, 0, 0, 0, 0, 0, -4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(53, 'Паровоз', 8, 0, 0, 1, 0, 0, 0, 0, 0, -7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(54, 'Большой робот', 13, 0, 0, 1, 0, 0, 0, 0, 0, -11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(55, 'Самолёт', 23, 0, 0, 1, 0, 0, 0, 0, 0, -20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(56, 'Маги-строители', 20, 15, 0, 1, 25, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(57, 'Магическая стройка', 33, 17, 0, 1, 40, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(58, 'Зверь-строитель', 0, 0, 5, 1, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(59, 'Огр-строитель', 0, 0, 10, 1, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(60, 'Гоблины-строители', 0, 0, 16, 1, 13, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(61, 'Звериный отстрой', 0, 0, 22, 1, 18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(62, 'Волшебный камень', 0, 4, 0, 1, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(63, 'Волшебная кладка', 0, 8, 0, 1, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(64, 'Подъём башни', 0, 14, 0, 1, 11, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0),
(65, 'Призыв башни', 0, 19, 0, 1, 16, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);

-- --------------------------------------------------------

--
-- Структура таблицы `collection`
--

CREATE TABLE `collection` (
  `collection_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `card_amount` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `collection`
--

INSERT INTO `collection` (`collection_id`, `player_id`, `card_id`, `card_amount`) VALUES
(1, 0, 1, 1),
(2, 0, 2, 1),
(3, 0, 3, 1),
(4, 0, 4, 1),
(5, 0, 5, 1),
(6, 0, 6, 1),
(7, 0, 7, 1),
(8, 0, 8, 1),
(9, 0, 9, 1),
(10, 0, 10, 1),
(11, 0, 11, 1),
(12, 0, 12, 1),
(13, 0, 13, 1),
(14, 0, 14, 1),
(15, 0, 15, 1),
(16, 0, 16, 1),
(17, 0, 17, 1),
(18, 0, 18, 1),
(19, 0, 19, 1),
(20, 0, 20, 1),
(21, 0, 21, 1),
(22, 0, 22, 1),
(23, 0, 23, 1),
(24, 0, 24, 1),
(25, 0, 25, 1),
(26, 0, 26, 1),
(27, 0, 27, 1),
(28, 0, 28, 1),
(29, 0, 29, 1),
(30, 0, 30, 1),
(31, 0, 31, 1),
(32, 0, 32, 1),
(33, 0, 33, 1),
(34, 0, 34, 1),
(35, 0, 35, 1),
(36, 0, 36, 1),
(37, 0, 37, 1),
(38, 0, 38, 1),
(39, 1, 1, 1),
(40, 1, 2, 1),
(41, 1, 3, 1),
(42, 1, 4, 1),
(43, 1, 5, 1),
(44, 1, 6, 1),
(45, 1, 7, 1),
(46, 1, 8, 1),
(47, 1, 9, 1),
(48, 1, 10, 1),
(49, 1, 11, 1),
(50, 1, 12, 1),
(51, 1, 13, 1),
(52, 1, 14, 1),
(53, 1, 15, 1),
(54, 1, 16, 1),
(55, 1, 17, 1),
(56, 1, 18, 1),
(57, 1, 19, 1),
(58, 1, 20, 1),
(59, 1, 21, 1),
(60, 1, 22, 1),
(61, 1, 23, 1),
(62, 1, 24, 1),
(63, 1, 25, 1),
(64, 1, 26, 1),
(65, 1, 27, 1),
(66, 1, 28, 1),
(67, 1, 29, 1),
(68, 1, 30, 1),
(69, 1, 31, 1),
(70, 1, 32, 1),
(71, 1, 33, 1),
(72, 1, 34, 1),
(73, 1, 35, 1),
(74, 1, 36, 1),
(75, 1, 37, 1),
(76, 1, 38, 1),
(77, 2, 1, 1),
(78, 2, 2, 1),
(79, 2, 3, 1),
(80, 2, 4, 1),
(81, 2, 5, 1),
(82, 2, 6, 1),
(83, 2, 7, 1),
(84, 2, 8, 1),
(85, 2, 9, 1),
(86, 2, 10, 1),
(87, 2, 11, 1),
(88, 2, 12, 1),
(89, 2, 13, 1),
(90, 2, 14, 1),
(91, 2, 15, 1),
(92, 2, 16, 1),
(93, 2, 17, 1),
(94, 2, 18, 1),
(95, 2, 19, 1),
(96, 2, 20, 1),
(97, 2, 21, 1),
(98, 2, 22, 1),
(99, 2, 23, 1),
(100, 2, 24, 1),
(101, 2, 25, 1),
(102, 2, 26, 1),
(103, 2, 27, 1),
(104, 2, 28, 1),
(105, 2, 29, 1),
(106, 2, 30, 1),
(107, 2, 31, 1),
(108, 2, 32, 1),
(109, 2, 33, 1),
(110, 2, 34, 1),
(111, 2, 35, 1),
(112, 2, 36, 1),
(113, 2, 37, 1),
(114, 2, 38, 1),
(115, 1, 39, 1),
(116, 1, 40, 1),
(117, 1, 41, 1),
(118, 1, 42, 1),
(119, 1, 43, 1),
(120, 1, 44, 1),
(121, 1, 45, 1),
(122, 1, 46, 1),
(123, 1, 47, 1),
(124, 1, 48, 1),
(125, 1, 49, 1),
(126, 1, 50, 1),
(127, 1, 51, 1),
(128, 1, 52, 1),
(129, 1, 53, 1),
(130, 1, 54, 1),
(131, 1, 55, 1),
(132, 1, 56, 1),
(133, 1, 57, 1),
(134, 1, 58, 1),
(135, 1, 59, 1),
(136, 1, 60, 1),
(137, 1, 61, 1),
(138, 1, 62, 1),
(139, 1, 63, 1),
(140, 1, 64, 1),
(141, 1, 65, 1),
(142, 2, 39, 1),
(143, 2, 40, 1),
(144, 2, 41, 1),
(145, 2, 42, 1),
(146, 2, 43, 1),
(147, 2, 44, 1),
(148, 2, 45, 1),
(149, 2, 46, 1),
(150, 2, 47, 1),
(151, 2, 48, 1),
(152, 2, 49, 1),
(153, 2, 50, 1),
(154, 2, 51, 1),
(155, 2, 52, 1),
(156, 2, 53, 1),
(157, 2, 54, 1),
(158, 2, 55, 1),
(159, 2, 56, 1),
(160, 2, 57, 1),
(161, 2, 58, 1),
(162, 2, 59, 1),
(163, 2, 60, 1),
(164, 2, 61, 1),
(165, 2, 62, 1),
(166, 2, 63, 1),
(167, 2, 64, 1),
(168, 2, 65, 1),
(169, 0, 39, 1),
(170, 0, 40, 1),
(171, 0, 41, 1),
(172, 0, 42, 1),
(173, 0, 43, 1),
(174, 0, 44, 1),
(175, 0, 45, 1),
(176, 0, 46, 1),
(177, 0, 47, 1),
(178, 0, 48, 1),
(179, 0, 49, 1),
(180, 0, 50, 1),
(181, 0, 51, 1),
(182, 0, 52, 1),
(183, 0, 53, 1),
(184, 0, 54, 1),
(185, 0, 55, 1),
(186, 0, 56, 1),
(187, 0, 57, 1),
(188, 0, 58, 1),
(189, 0, 59, 1),
(190, 0, 60, 1),
(191, 0, 61, 1),
(192, 0, 62, 1),
(193, 0, 63, 1),
(194, 0, 64, 1),
(195, 0, 65, 1);

-- --------------------------------------------------------

--
-- Структура таблицы `cond`
--

CREATE TABLE `cond` (
  `cond_id` int(11) NOT NULL,
  `field_id` int(11) NOT NULL,
  `cond_value` int(11) NOT NULL DEFAULT '0',
  `cond_sign` int(11) NOT NULL DEFAULT '1'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `condcard`
--

CREATE TABLE `condcard` (
  `condcard_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL,
  `cond_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `deck`
--

CREATE TABLE `deck` (
  `deck_id` int(11) NOT NULL,
  `deck_num` int(11) NOT NULL,
  `deck_name` varchar(50) NOT NULL,
  `player_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `deck`
--

INSERT INTO `deck` (`deck_id`, `deck_num`, `deck_name`, `player_id`) VALUES
(2, 1, 'startDeck', 2),
(3, 1, 'startDeck', 0),
(44, 1, 'New deck 1', 1),
(46, 2, 'New deck 3', 1),
(47, 3, 'New deck 4', 1);

-- --------------------------------------------------------

--
-- Структура таблицы `deckcard`
--

CREATE TABLE `deckcard` (
  `deckCard_id` int(11) NOT NULL,
  `deck_id` int(11) NOT NULL,
  `card_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `deckcard`
--

INSERT INTO `deckcard` (`deckCard_id`, `deck_id`, `card_id`) VALUES
(31, 3, 1),
(32, 3, 2),
(33, 3, 3),
(34, 3, 4),
(35, 3, 5),
(36, 3, 6),
(37, 3, 7),
(38, 3, 8),
(39, 3, 9),
(40, 3, 10),
(41, 3, 11),
(42, 3, 12),
(43, 3, 13),
(44, 3, 14),
(45, 3, 15),
(46, 3, 16),
(47, 3, 17),
(48, 3, 18),
(49, 3, 19),
(50, 3, 20),
(1120, 46, 0),
(1121, 46, 0),
(1122, 46, 0),
(1123, 46, 0),
(1124, 46, 0),
(1125, 46, 0),
(1126, 46, 0),
(1127, 46, 0),
(1128, 46, 0),
(1129, 46, 0),
(1130, 46, 0),
(1131, 46, 0),
(1132, 46, 0),
(1133, 46, 0),
(1134, 46, 0),
(1135, 46, 0),
(1136, 46, 0),
(1137, 46, 0),
(1138, 46, 0),
(1139, 46, 0),
(1140, 44, 4),
(1141, 44, 3),
(1142, 44, 2),
(1143, 44, 1),
(1144, 44, 5),
(1145, 44, 6),
(1146, 44, 7),
(1147, 44, 8),
(1148, 44, 9),
(1149, 44, 10),
(1150, 44, 11),
(1151, 44, 12),
(1152, 44, 13),
(1153, 44, 14),
(1154, 44, 15),
(1155, 44, 16),
(1156, 44, 17),
(1157, 44, 18),
(1158, 44, 19),
(1159, 44, 20),
(1160, 47, 13),
(1161, 47, 14),
(1162, 47, 15),
(1163, 47, 19),
(1164, 47, 20),
(1165, 47, 21),
(1166, 47, 32),
(1167, 47, 26),
(1168, 47, 30),
(1169, 47, 37),
(1170, 47, 36),
(1171, 47, 40),
(1172, 47, 42),
(1173, 47, 43),
(1174, 47, 48),
(1175, 47, 41),
(1176, 47, 52),
(1177, 47, 63),
(1178, 47, 47),
(1179, 47, 31),
(1180, 2, 1),
(1181, 2, 2),
(1182, 2, 3),
(1183, 2, 4),
(1184, 2, 5),
(1185, 2, 7),
(1186, 2, 8),
(1187, 2, 9),
(1188, 2, 10),
(1189, 2, 11),
(1190, 2, 12),
(1191, 2, 13),
(1192, 2, 14),
(1193, 2, 15),
(1194, 2, 16),
(1195, 2, 17),
(1196, 2, 18),
(1197, 2, 19),
(1198, 2, 20),
(1199, 2, 31);

-- --------------------------------------------------------

--
-- Структура таблицы `field`
--

CREATE TABLE `field` (
  `field_id` int(11) NOT NULL,
  `field_name` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Структура таблицы `gameconf`
--

CREATE TABLE `gameconf` (
  `gameconf_id` int(11) NOT NULL,
  `gameconf_hash` int(11) NOT NULL,
  `pack_cost` int(11) NOT NULL,
  `gold_take` int(11) NOT NULL,
  `max_cards` int(11) NOT NULL,
  `tower_hp` int(11) NOT NULL,
  `wall_hp` int(11) NOT NULL,
  `res` int(11) NOT NULL,
  `gen` int(11) NOT NULL,
  `tower_hp_win` int(11) NOT NULL,
  `once_res_win` int(11) NOT NULL,
  `all_res_win` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `gameconf`
--

INSERT INTO `gameconf` (`gameconf_id`, `gameconf_hash`, `pack_cost`, `gold_take`, `max_cards`, `tower_hp`, `wall_hp`, `res`, `gen`, `tower_hp_win`, `once_res_win`, `all_res_win`) VALUES
(1, 1, 100, 100, 20, 30, 10, 2, 3, 100, 75, 50);

-- --------------------------------------------------------

--
-- Структура таблицы `matches`
--

CREATE TABLE `matches` (
  `match_id` int(11) NOT NULL,
  `match_type` int(11) NOT NULL,
  `match_result` int(11) NOT NULL DEFAULT '0',
  `match_win_player_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `matches`
--

INSERT INTO `matches` (`match_id`, `match_type`, `match_result`, `match_win_player_id`) VALUES
(2, 2, 2, 0),
(3, 2, 1, 0),
(4, 2, 1, 0),
(5, 2, 1, 0),
(6, 2, 1, 0),
(7, 2, 1, 0),
(8, 2, 1, 0),
(9, 2, 1, 0),
(10, 2, 1, 0),
(11, 2, 1, 0),
(12, 2, 1, 0),
(13, 2, 1, 0),
(14, 2, 1, 0),
(15, 2, 1, 0),
(16, 2, 2, 0),
(17, 2, 1, 0),
(18, 2, 1, 0),
(19, 2, 2, 0),
(20, 1, 1, 1),
(21, 2, 2, 0),
(22, 2, 2, 0);

-- --------------------------------------------------------

--
-- Структура таблицы `player`
--

CREATE TABLE `player` (
  `player_id` int(11) NOT NULL,
  `player_name` varchar(100) NOT NULL,
  `player_login` varchar(50) NOT NULL,
  `player_password` varchar(50) NOT NULL,
  `player_gold` int(11) NOT NULL,
  `player_online` int(11) NOT NULL DEFAULT '0',
  `player_rating` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `player`
--

INSERT INTO `player` (`player_id`, `player_name`, `player_login`, `player_password`, `player_gold`, `player_online`, `player_rating`) VALUES
(1, 'vasya', '1', '1', 0, 0, 0),
(2, 'petya', '2', '2', 0, 0, 0),
(3, 'valera', '3', '3', 0, 0, 0),
(4, 'valentin', '4', '4', 0, 0, 0);

-- --------------------------------------------------------

--
-- Структура таблицы `playermatch`
--

CREATE TABLE `playermatch` (
  `playermatch_id` int(11) NOT NULL,
  `match_id` int(11) NOT NULL,
  `player_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `playermatch`
--

INSERT INTO `playermatch` (`playermatch_id`, `match_id`, `player_id`) VALUES
(1, 2, 1),
(2, 3, 1),
(3, 4, 1),
(4, 5, 1),
(5, 6, 1),
(6, 7, 1),
(7, 8, 1),
(8, 9, 1),
(9, 10, 1),
(10, 11, 1),
(11, 12, 1),
(12, 13, 1),
(13, 14, 1),
(14, 15, 1),
(15, 16, 1),
(16, 17, 1),
(17, 18, 1),
(18, 19, 1),
(19, 20, 2),
(20, 20, 1),
(21, 21, 2),
(22, 22, 2);

-- --------------------------------------------------------

--
-- Структура таблицы `ratingsearch`
--

CREATE TABLE `ratingsearch` (
  `player_id` int(11) NOT NULL,
  `player_rating` int(11) NOT NULL,
  `difference` int(11) NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `ratingsearch`
--

INSERT INTO `ratingsearch` (`player_id`, `player_rating`, `difference`, `timestamp`) VALUES
(1, 500, 0, '2017-02-16 12:54:35'),
(2, 200, 50, '2017-02-16 12:57:04');

-- --------------------------------------------------------

--
-- Структура таблицы `status`
--

CREATE TABLE `status` (
  `status_id` int(11) NOT NULL,
  `status_player1_id` int(11) NOT NULL,
  `status_player2_id` int(11) NOT NULL,
  `status_turn` tinyint(1) NOT NULL,
  `status_card_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

--
-- Дамп данных таблицы `status`
--

INSERT INTO `status` (`status_id`, `status_player1_id`, `status_player2_id`, `status_turn`, `status_card_id`) VALUES
(1, 1, 2, 0, 8);

--
-- Индексы сохранённых таблиц
--

--
-- Индексы таблицы `card`
--
ALTER TABLE `card`
  ADD PRIMARY KEY (`card_id`);

--
-- Индексы таблицы `collection`
--
ALTER TABLE `collection`
  ADD PRIMARY KEY (`collection_id`),
  ADD KEY `card_id` (`card_id`),
  ADD KEY `player_id` (`player_id`);

--
-- Индексы таблицы `cond`
--
ALTER TABLE `cond`
  ADD PRIMARY KEY (`cond_id`);

--
-- Индексы таблицы `deck`
--
ALTER TABLE `deck`
  ADD PRIMARY KEY (`deck_id`);

--
-- Индексы таблицы `deckcard`
--
ALTER TABLE `deckcard`
  ADD PRIMARY KEY (`deckCard_id`);

--
-- Индексы таблицы `gameconf`
--
ALTER TABLE `gameconf`
  ADD PRIMARY KEY (`gameconf_id`);

--
-- Индексы таблицы `matches`
--
ALTER TABLE `matches`
  ADD PRIMARY KEY (`match_id`);

--
-- Индексы таблицы `player`
--
ALTER TABLE `player`
  ADD PRIMARY KEY (`player_id`);

--
-- Индексы таблицы `playermatch`
--
ALTER TABLE `playermatch`
  ADD PRIMARY KEY (`playermatch_id`);

--
-- Индексы таблицы `ratingsearch`
--
ALTER TABLE `ratingsearch`
  ADD PRIMARY KEY (`player_id`);

--
-- Индексы таблицы `status`
--
ALTER TABLE `status`
  ADD PRIMARY KEY (`status_id`);

--
-- AUTO_INCREMENT для сохранённых таблиц
--

--
-- AUTO_INCREMENT для таблицы `card`
--
ALTER TABLE `card`
  MODIFY `card_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=66;
--
-- AUTO_INCREMENT для таблицы `collection`
--
ALTER TABLE `collection`
  MODIFY `collection_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=196;
--
-- AUTO_INCREMENT для таблицы `cond`
--
ALTER TABLE `cond`
  MODIFY `cond_id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT для таблицы `deck`
--
ALTER TABLE `deck`
  MODIFY `deck_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=48;
--
-- AUTO_INCREMENT для таблицы `deckcard`
--
ALTER TABLE `deckcard`
  MODIFY `deckCard_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1200;
--
-- AUTO_INCREMENT для таблицы `matches`
--
ALTER TABLE `matches`
  MODIFY `match_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
--
-- AUTO_INCREMENT для таблицы `player`
--
ALTER TABLE `player`
  MODIFY `player_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;
--
-- AUTO_INCREMENT для таблицы `playermatch`
--
ALTER TABLE `playermatch`
  MODIFY `playermatch_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=23;
--
-- AUTO_INCREMENT для таблицы `status`
--
ALTER TABLE `status`
  MODIFY `status_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
