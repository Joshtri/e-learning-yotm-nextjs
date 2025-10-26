--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: neondb_owner
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO neondb_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: neondb_owner
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AssignmentType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."AssignmentType" AS ENUM (
    'MATERIAL',
    'EXERCISE',
    'QUIZ',
    'MIDTERM',
    'FINAL_EXAM',
    'DAILY_TEST',
    'START_SEMESTER_TEST'
);


ALTER TYPE public."AssignmentType" OWNER TO neondb_owner;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'SICK',
    'EXCUSED',
    'ABSENT'
);


ALTER TYPE public."AttendanceStatus" OWNER TO neondb_owner;

--
-- Name: ChatRoomType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."ChatRoomType" AS ENUM (
    'PRIVATE',
    'GROUP',
    'FORUM'
);


ALTER TYPE public."ChatRoomType" OWNER TO neondb_owner;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER'
);


ALTER TYPE public."Gender" OWNER TO neondb_owner;

--
-- Name: LearningMaterialType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."LearningMaterialType" AS ENUM (
    'LINK_YOUTUBE',
    'FILE'
);


ALTER TYPE public."LearningMaterialType" OWNER TO neondb_owner;

--
-- Name: QuestionType; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."QuestionType" AS ENUM (
    'MULTIPLE_CHOICE',
    'TRUE_FALSE',
    'SHORT_ANSWER',
    'ESSAY',
    'MATCHING'
);


ALTER TYPE public."QuestionType" OWNER TO neondb_owner;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Role" AS ENUM (
    'ADMIN',
    'TUTOR',
    'STUDENT',
    'HOMEROOM_TEACHER'
);


ALTER TYPE public."Role" OWNER TO neondb_owner;

--
-- Name: Semester; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Semester" AS ENUM (
    'GANJIL',
    'GENAP'
);


ALTER TYPE public."Semester" OWNER TO neondb_owner;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."Status" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'PENDING'
);


ALTER TYPE public."Status" OWNER TO neondb_owner;

--
-- Name: StudentStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."StudentStatus" AS ENUM (
    'ACTIVE',
    'GRADUATED',
    'TRANSFERRED',
    'DROPPED_OUT',
    'DECEASED'
);


ALTER TYPE public."StudentStatus" OWNER TO neondb_owner;

--
-- Name: SubmissionStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."SubmissionStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'SUBMITTED',
    'GRADED',
    'LATE'
);


ALTER TYPE public."SubmissionStatus" OWNER TO neondb_owner;

--
-- Name: TutorStatus; Type: TYPE; Schema: public; Owner: neondb_owner
--

CREATE TYPE public."TutorStatus" AS ENUM (
    'ACTIVE',
    'RESIGNED',
    'RETIRED',
    'DECEASED',
    'ON_LEAVE'
);


ALTER TYPE public."TutorStatus" OWNER TO neondb_owner;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AcademicYear; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AcademicYear" (
    id character varying(40) DEFAULT concat('acy_', gen_random_uuid()) NOT NULL,
    "tahunMulai" integer NOT NULL,
    "tahunSelesai" integer NOT NULL,
    "isActive" boolean DEFAULT false NOT NULL,
    semester public."Semester" DEFAULT 'GANJIL'::public."Semester" NOT NULL
);


ALTER TABLE public."AcademicYear" OWNER TO neondb_owner;

--
-- Name: Answer; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Answer" (
    id character varying(40) DEFAULT concat('ans_', gen_random_uuid()) NOT NULL,
    "submissionId" text NOT NULL,
    "questionId" text NOT NULL,
    jawaban text NOT NULL,
    "adalahBenar" boolean,
    feedback character varying(500),
    nilai double precision
);


ALTER TABLE public."Answer" OWNER TO neondb_owner;

--
-- Name: AnswerOption; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AnswerOption" (
    id character varying(40) DEFAULT concat('opt_', gen_random_uuid()) NOT NULL,
    "questionId" text NOT NULL,
    teks character varying(500) NOT NULL,
    "adalahBenar" boolean DEFAULT false NOT NULL,
    kode text
);


ALTER TABLE public."AnswerOption" OWNER TO neondb_owner;

--
-- Name: Assignment; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Assignment" (
    id character varying(40) DEFAULT concat('asn_', gen_random_uuid()) NOT NULL,
    judul character varying(200) NOT NULL,
    deskripsi text,
    jenis public."AssignmentType" NOT NULL,
    "classSubjectTutorId" text NOT NULL,
    "batasWaktuMenit" integer,
    "nilaiMaksimal" integer,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "questionsFromPdf" text,
    "TanggalMulai" date,
    "TanggalSelesai" date
);


ALTER TABLE public."Assignment" OWNER TO neondb_owner;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Attendance" (
    id character varying(40) DEFAULT concat('att_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "classId" text NOT NULL,
    "academicYearId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    status public."AttendanceStatus" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "attendanceSessionId" character varying(40)
);


ALTER TABLE public."Attendance" OWNER TO neondb_owner;

--
-- Name: AttendanceSession; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."AttendanceSession" (
    id character varying(40) DEFAULT concat('ats_', gen_random_uuid()) NOT NULL,
    "tutorId" text NOT NULL,
    "classId" text NOT NULL,
    "academicYearId" text NOT NULL,
    tanggal timestamp(3) without time zone NOT NULL,
    keterangan character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "subjectId" text
);


ALTER TABLE public."AttendanceSession" OWNER TO neondb_owner;

--
-- Name: BehaviorScore; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."BehaviorScore" (
    id character varying(40) DEFAULT concat('bhs_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "academicYearId" text NOT NULL,
    spiritual double precision NOT NULL,
    sosial double precision NOT NULL,
    kehadiran double precision NOT NULL,
    catatan text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "classId" text NOT NULL
);


ALTER TABLE public."BehaviorScore" OWNER TO neondb_owner;

--
-- Name: ChatMessage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ChatMessage" (
    id character varying(40) DEFAULT concat('msg_', gen_random_uuid()) NOT NULL,
    "senderId" text NOT NULL,
    "roomId" text NOT NULL,
    content text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."ChatMessage" OWNER TO neondb_owner;

--
-- Name: ChatRoom; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ChatRoom" (
    id character varying(40) DEFAULT concat('crm_', gen_random_uuid()) NOT NULL,
    name text,
    type public."ChatRoomType" DEFAULT 'PRIVATE'::public."ChatRoomType" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    closed boolean DEFAULT false NOT NULL,
    "createdById" text,
    pinned boolean DEFAULT false NOT NULL,
    "classSubjectTutorId" text
);


ALTER TABLE public."ChatRoom" OWNER TO neondb_owner;

--
-- Name: Class; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Class" (
    id character varying(40) DEFAULT concat('cls_', gen_random_uuid()) NOT NULL,
    "namaKelas" character varying(50) NOT NULL,
    "programId" text NOT NULL,
    "academicYearId" text NOT NULL,
    "homeroomTeacherId" text
);


ALTER TABLE public."Class" OWNER TO neondb_owner;

--
-- Name: ClassSubjectTutor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ClassSubjectTutor" (
    id character varying(40) DEFAULT concat('cst_', gen_random_uuid()) NOT NULL,
    "tutorId" text NOT NULL,
    "classId" text NOT NULL,
    "subjectId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ClassSubjectTutor" OWNER TO neondb_owner;

--
-- Name: DiscussionMessage; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DiscussionMessage" (
    id character varying(40) DEFAULT concat('dsm_', gen_random_uuid()) NOT NULL,
    "roomId" text NOT NULL,
    "senderId" text NOT NULL,
    "isiPesan" text NOT NULL,
    "sentAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DiscussionMessage" OWNER TO neondb_owner;

--
-- Name: DiscussionRoom; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."DiscussionRoom" (
    id character varying(40) DEFAULT concat('dsr_', gen_random_uuid()) NOT NULL,
    "classSubjectTutorId" text NOT NULL,
    judul character varying(200) NOT NULL,
    deskripsi text,
    "createdById" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."DiscussionRoom" OWNER TO neondb_owner;

--
-- Name: FinalScore; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."FinalScore" (
    id character varying(40) DEFAULT concat('fns_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "subjectId" text NOT NULL,
    "nilaiAkhir" double precision NOT NULL,
    "tahunAjaranId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."FinalScore" OWNER TO neondb_owner;

--
-- Name: Holiday; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Holiday" (
    id character varying(40) DEFAULT concat('hld_', gen_random_uuid()) NOT NULL,
    tanggal timestamp(3) without time zone NOT NULL,
    reason character varying(255) NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Holiday" OWNER TO neondb_owner;

--
-- Name: HolidayRange; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."HolidayRange" (
    id character varying(40) DEFAULT concat('hlr_', gen_random_uuid()) NOT NULL,
    "startDate" timestamp(3) without time zone NOT NULL,
    "endDate" timestamp(3) without time zone NOT NULL,
    "academicYearId" text,
    nama text NOT NULL
);


ALTER TABLE public."HolidayRange" OWNER TO neondb_owner;

--
-- Name: LearningMaterial; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."LearningMaterial" (
    id character varying(40) DEFAULT concat('mat_', gen_random_uuid()) NOT NULL,
    judul character varying(200) NOT NULL,
    konten text NOT NULL,
    "fileUrl" character varying(255),
    "classSubjectTutorId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    pertemuan character varying(10) DEFAULT '1'::character varying,
    "tipeMateri" public."LearningMaterialType" DEFAULT 'FILE'::public."LearningMaterialType"
);


ALTER TABLE public."LearningMaterial" OWNER TO neondb_owner;

--
-- Name: Log; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Log" (
    id text NOT NULL,
    "userId" text NOT NULL,
    action text NOT NULL,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    metadata jsonb
);


ALTER TABLE public."Log" OWNER TO neondb_owner;

--
-- Name: Notification; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Notification" (
    id character varying(40) DEFAULT concat('ntf_', gen_random_uuid()) NOT NULL,
    "senderId" text NOT NULL,
    "receiverId" text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL,
    "isRead" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Notification" OWNER TO neondb_owner;

--
-- Name: Program; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Program" (
    id character varying(40) DEFAULT concat('prg_', gen_random_uuid()) NOT NULL,
    "namaPaket" character varying(50) NOT NULL
);


ALTER TABLE public."Program" OWNER TO neondb_owner;

--
-- Name: ProgramSubject; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."ProgramSubject" (
    id character varying(40) DEFAULT concat('psj_', gen_random_uuid()) NOT NULL,
    "programId" text NOT NULL,
    "subjectId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ProgramSubject" OWNER TO neondb_owner;

--
-- Name: Question; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Question" (
    id character varying(40) DEFAULT concat('qst_', gen_random_uuid()) NOT NULL,
    "assignmentId" text,
    "quizId" text,
    teks text NOT NULL,
    jenis public."QuestionType" NOT NULL,
    poin integer DEFAULT 1 NOT NULL,
    "jawabanBenar" text,
    pembahasan text
);


ALTER TABLE public."Question" OWNER TO neondb_owner;

--
-- Name: Quiz; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Quiz" (
    id character varying(40) DEFAULT concat('qz_', gen_random_uuid()) NOT NULL,
    judul character varying(200) NOT NULL,
    deskripsi text,
    "classSubjectTutorId" text NOT NULL,
    "waktuMulai" timestamp(3) without time zone NOT NULL,
    "waktuSelesai" timestamp(3) without time zone NOT NULL,
    "durasiMenit" integer NOT NULL,
    "nilaiMaksimal" integer NOT NULL,
    "acakSoal" boolean DEFAULT false NOT NULL,
    "acakJawaban" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Quiz" OWNER TO neondb_owner;

--
-- Name: SkillScore; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."SkillScore" (
    id character varying(40) DEFAULT concat('skl_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "subjectId" text NOT NULL,
    nilai double precision NOT NULL,
    keterangan text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."SkillScore" OWNER TO neondb_owner;

--
-- Name: Student; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Student" (
    id character varying(40) DEFAULT concat('std_', gen_random_uuid()) NOT NULL,
    "userId" text NOT NULL,
    "namaLengkap" character varying(100) NOT NULL,
    nisn character varying(20) NOT NULL,
    "jenisKelamin" public."Gender",
    "tempatLahir" character varying(50),
    "tanggalLahir" timestamp(3) without time zone,
    alamat text,
    "fotoUrl" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "classId" text,
    status public."StudentStatus" DEFAULT 'ACTIVE'::public."StudentStatus" NOT NULL,
    "diprosesNaik" boolean DEFAULT false NOT NULL,
    "naikKelas" boolean DEFAULT false NOT NULL,
    nis character varying(20),
    "noTelepon" character varying(20)
);


ALTER TABLE public."Student" OWNER TO neondb_owner;

--
-- Name: StudentClassHistory; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."StudentClassHistory" (
    id character varying(40) DEFAULT concat('sch_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "classId" text NOT NULL,
    "academicYearId" text NOT NULL,
    "naikKelas" boolean DEFAULT false NOT NULL,
    "nilaiAkhir" double precision,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."StudentClassHistory" OWNER TO neondb_owner;

--
-- Name: Subject; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Subject" (
    id character varying(40) DEFAULT concat('sub_', gen_random_uuid()) NOT NULL,
    "namaMapel" character varying(100) NOT NULL,
    "kodeMapel" character varying(20),
    deskripsi text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Subject" OWNER TO neondb_owner;

--
-- Name: Submission; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Submission" (
    id character varying(40) DEFAULT concat('sbm_', gen_random_uuid()) NOT NULL,
    "studentId" text NOT NULL,
    "assignmentId" text,
    "quizId" text,
    status public."SubmissionStatus" DEFAULT 'NOT_STARTED'::public."SubmissionStatus" NOT NULL,
    "waktuMulai" timestamp(3) without time zone,
    "waktuKumpul" timestamp(3) without time zone,
    nilai double precision,
    "waktuDinilai" timestamp(3) without time zone,
    feedback text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "answerPdf" text
);


ALTER TABLE public."Submission" OWNER TO neondb_owner;

--
-- Name: Tutor; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."Tutor" (
    id character varying(40) DEFAULT concat('ttr_', gen_random_uuid()) NOT NULL,
    "userId" text NOT NULL,
    "namaLengkap" character varying(100) NOT NULL,
    bio text,
    pendidikan text,
    pengalaman text,
    telepon character varying(20),
    "fotoUrl" character varying(255),
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    status public."TutorStatus" DEFAULT 'ACTIVE'::public."TutorStatus" NOT NULL
);


ALTER TABLE public."Tutor" OWNER TO neondb_owner;

--
-- Name: User; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."User" (
    id character varying(40) DEFAULT concat('usr_', gen_random_uuid()) NOT NULL,
    nama character varying(100) NOT NULL,
    email character varying(255) NOT NULL,
    password text NOT NULL,
    role public."Role" NOT NULL,
    status public."Status" DEFAULT 'ACTIVE'::public."Status",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastLoginAt" timestamp(3) without time zone
);


ALTER TABLE public."User" OWNER TO neondb_owner;

--
-- Name: _RoomUsers; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public."_RoomUsers" (
    "A" character varying(40) NOT NULL,
    "B" character varying(40) NOT NULL
);


ALTER TABLE public."_RoomUsers" OWNER TO neondb_owner;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: neondb_owner
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO neondb_owner;

--
-- Data for Name: AcademicYear; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."AcademicYear" (id, "tahunMulai", "tahunSelesai", "isActive", semester) VALUES ('acy_8af8eabf-87f3-455d-823e-e0d3ed51305e', 2026, 2027, false, 'GANJIL');
INSERT INTO public."AcademicYear" (id, "tahunMulai", "tahunSelesai", "isActive", semester) VALUES ('acy_30dacf50-6af2-471e-85a5-64bdf373f65b', 2025, 2026, false, 'GANJIL');
INSERT INTO public."AcademicYear" (id, "tahunMulai", "tahunSelesai", "isActive", semester) VALUES ('acy_8dc98713-54c7-4e0f-90e8-8e455440ee0a', 2025, 2026, true, 'GENAP');


--
-- Data for Name: Answer; Type: TABLE DATA; Schema: public; Owner: neondb_owner
--

INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_739a5451-e5b3-499d-9907-36e532b242b3', 'sbm_e7e787f2-f643-4ca4-9103-49856062c8fd', 'qst_bbbd9c6c-0b36-4bd6-b354-4d2d5f3e5672', 'Tidak mengikuti gaya hidup dunia yang bertentangan dengan firman Tuhan', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_df855844-7712-4e61-8110-f4285bb04b66', 'sbm_e7e787f2-f643-4ca4-9103-49856062c8fd', 'qst_e91df7e7-5377-4ee3-9e27-f51ef43f62de', 'Sebagai bentuk ketaatan murid-murid Yesus', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cbfbe468-e0df-47df-8d9c-29a0c5de7faf', 'sbm_0350994f-ba82-47e0-a289-5bbebc11345d', 'qst_bbbd9c6c-0b36-4bd6-b354-4d2d5f3e5672', 'Tidak mengikuti gaya hidup dunia yang bertentangan dengan firman Tuhan', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_70be0193-92db-4cf6-ba9a-27f7ef610eed', 'sbm_0350994f-ba82-47e0-a289-5bbebc11345d', 'qst_e91df7e7-5377-4ee3-9e27-f51ef43f62de', 'Sebagai bentuk ketaatan murid-murid Yesus', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ba465e0d-5552-4c44-afbf-cf5846ad20d6', 'sbm_795a5baa-9a15-4d1b-9bd9-bf0bae227778', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'Sepak bola, bola voli, bola basket', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a85a1c06-7ced-42d9-9cfb-6d94bea3f908', 'sbm_795a5baa-9a15-4d1b-9bd9-bf0bae227778', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'Passing bawah', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7513689e-414b-4679-a48b-7c264679c04b', 'sbm_795a5baa-9a15-4d1b-9bd9-bf0bae227778', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '12', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ce3b133e-a463-4a67-84da-e00f5aae672c', 'sbm_795a5baa-9a15-4d1b-9bd9-bf0bae227778', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'Memasukkan bola ke gawang/keranjang/lapangan lawan untuk memperoleh skor', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d90b17f4-b9bd-49f8-af17-768223a5b4ff', 'sbm_795a5baa-9a15-4d1b-9bd9-bf0bae227778', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', 'Dribbling', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_12a8305a-1708-4434-b5d0-d873a186e649', 'sbm_8be37f99-cc96-4bf9-8762-bef3f8c1da11', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'Ketergantungan gadget', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_008131fb-fbfa-4234-bae5-d12d4350f4cc', 'sbm_8be37f99-cc96-4bf9-8762-bef3f8c1da11', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'Teknologi Informasi dan Komunikasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_af66abf6-f5ee-43fd-a57e-7ef0150c6f44', 'sbm_8be37f99-cc96-4bf9-8762-bef3f8c1da11', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'Mempermudah mengakses informasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4157f8e9-023d-42d3-b87a-e7da34081f34', 'sbm_8be37f99-cc96-4bf9-8762-bef3f8c1da11', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', 'Dampak Positif: Mempercepat arus informasi, mempermudah belajar.
Dampak Negatif: Ketergantungan gadget, cyberbullying, penyebaran hoaks.', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bbcd4c37-77af-4dbc-877a-45e9c0f4af21', 'sbm_8be37f99-cc96-4bf9-8762-bef3f8c1da11', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', 'Mempermudah komunikasi, akses informasi, pengolahan data, hiburan.', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4acbaae4-4b36-49af-892e-6ca060658f46', 'sbm_f5e2b880-0464-4b9e-b1c1-9060dafad356', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'Ketergantungan gadget', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b66c6b9f-a7c2-4334-9aff-b2b27bc06a7d', 'sbm_f5e2b880-0464-4b9e-b1c1-9060dafad356', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'Teknologi Informasi dan Komunikasi.', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_258d2212-ca7b-4e2d-80c0-e745486f7919', 'sbm_f5e2b880-0464-4b9e-b1c1-9060dafad356', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'mempermudah belajar', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f25eab60-0619-4104-8114-210cc32e390a', 'sbm_f5e2b880-0464-4b9e-b1c1-9060dafad356', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', 'Dampak Positif: Mempercepat arus informasi, mempermudah belajar.
Dampak Negatif: Ketergantungan gadget, cyberbullying, penyebaran hoaks.', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_98e017a9-7d5a-4411-a1a6-ee3a4f428db0', 'sbm_f5e2b880-0464-4b9e-b1c1-9060dafad356', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', 'Mempermudah komunikasi, akses informasi, pengolahan data, hiburan.', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_47cf5710-6f58-47e4-a36a-fcad78ae184e', 'sbm_7b4fdabb-8604-4258-8e7b-81df31201d26', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'Sepak bola, bola voli, bola basket', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f795379f-7bfe-4e34-81fe-298184a0b1f0', 'sbm_7b4fdabb-8604-4258-8e7b-81df31201d26', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'Passing bawah', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1155c1d5-c86b-48ab-8297-693708cf121b', 'sbm_7b4fdabb-8604-4258-8e7b-81df31201d26', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '11', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_db2b58c4-993b-4e6d-af45-faa359a9a66d', 'sbm_7b4fdabb-8604-4258-8e7b-81df31201d26', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'Memasukkan bola ke gawang/keranjang/lapangan lawan untuk memperoleh skor', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_35adb9e3-548f-4e14-a898-3b455498476e', 'sbm_7b4fdabb-8604-4258-8e7b-81df31201d26', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', '', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_843201d1-c34a-42be-95eb-92c97140f7f6', 'sbm_c71086b7-66fb-4911-b050-a08186389650', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'Penyebaran hoax', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_42c3d1f9-39c6-488d-a1c1-5432b45b5250', 'sbm_c71086b7-66fb-4911-b050-a08186389650', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'Teknologi Informasi dan Komunikasi ', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_542181d3-cba1-460f-8273-2b09a6244905', 'sbm_c71086b7-66fb-4911-b050-a08186389650', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'Mempercepat arus informasi ', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_15409080-6876-4e70-9c60-5742ca9fecec', 'sbm_c71086b7-66fb-4911-b050-a08186389650', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', '+ : mempercepat arus informasi, mempermudah belajar 
- : Ketergantungan gadget, penyebaran hoax', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_58995601-cb42-4a1b-aa99-8c5ab48cca71', 'sbm_c71086b7-66fb-4911-b050-a08186389650', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', 'Mempermudah komunikasi ', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_5120c504-c66e-43d0-89e1-10c359e74d5b', 'sbm_dc52d485-8f1b-4901-bbe6-7ca3e58e0e40', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'Sepak bola', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f9b7b2a0-2b5f-4f51-84a8-cc14d0b17865', 'sbm_dc52d485-8f1b-4901-bbe6-7ca3e58e0e40', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'Passing bawah ', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d142c677-a4f6-4035-9028-1e2280017a91', 'sbm_dc52d485-8f1b-4901-bbe6-7ca3e58e0e40', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '11', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_df72019c-083f-4b4f-8fcd-5e13c07b8340', 'sbm_dc52d485-8f1b-4901-bbe6-7ca3e58e0e40', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'Memasukkan bola ke gawang ', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_966dac1e-355e-4c33-9f14-4168cdea46c0', 'sbm_dc52d485-8f1b-4901-bbe6-7ca3e58e0e40', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', 'Dribbing', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_86db2eb6-020f-4e40-9d59-bcd6fc9c5ac7', 'sbm_39676eed-20b6-444a-b675-ea09c4d001eb', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'jadi malas', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3608bdbd-8c4f-4ba8-ad14-7e96bb0e517a', 'sbm_39676eed-20b6-444a-b675-ea09c4d001eb', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'tekno info kom', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2da2370a-0da6-4173-96f7-c20a11aec93f', 'sbm_39676eed-20b6-444a-b675-ea09c4d001eb', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'mudah belajar', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_dd1053e2-b467-415c-9e26-e525d2593e12', 'sbm_39676eed-20b6-444a-b675-ea09c4d001eb', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', '1, 2', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cf528c59-9388-435b-9d96-9741182622cc', 'sbm_39676eed-20b6-444a-b675-ea09c4d001eb', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', 'berguna', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6be94991-699e-430b-a222-9514340bc6f8', 'sbm_a5486479-3384-42e8-89fe-8fcbd95a2a61', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'bola kaki', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_907b1161-8d3c-48c6-bae2-31cb70835b9f', 'sbm_a5486479-3384-42e8-89fe-8fcbd95a2a61', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'passing bawah', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c6d08465-54f3-4620-98d4-842e78bff700', 'sbm_a5486479-3384-42e8-89fe-8fcbd95a2a61', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '11', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3a1d5947-d10d-459a-bfd3-cade951ed698', 'sbm_a5486479-3384-42e8-89fe-8fcbd95a2a61', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'mencetak gol', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4306391d-916c-4cdc-a336-6853671d5ac1', 'sbm_a5486479-3384-42e8-89fe-8fcbd95a2a61', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', 'dribbing', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d164231d-8e64-4089-b62e-53a867e6f127', 'sbm_cd93af22-9ad1-441b-a6b2-00c8adf9aba6', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'meyebar hoax', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c65a812f-241b-4ba0-a11d-549b1e209999', 'sbm_cd93af22-9ad1-441b-a6b2-00c8adf9aba6', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'tekno info komni', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6c6f5d50-1e40-46fa-906f-abc3c2c60314', 'sbm_cd93af22-9ad1-441b-a6b2-00c8adf9aba6', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'lancar arus informasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_06741175-8f25-4559-ba84-7a0c7ac39d2e', 'sbm_cd93af22-9ad1-441b-a6b2-00c8adf9aba6', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', '', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a925ad13-bcf9-4402-9099-193db38ee3a8', 'sbm_cd93af22-9ad1-441b-a6b2-00c8adf9aba6', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', '', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4f6de220-96e2-4740-a60c-06317d7151ff', 'sbm_39a4065f-1274-40bf-920d-f88619242f21', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'bola kaki', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_72011540-c5b9-4138-906e-77ee2409c116', 'sbm_39a4065f-1274-40bf-920d-f88619242f21', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'passing bawah', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_97da3a47-ed9e-4c78-8dae-424d3984ffa1', 'sbm_39a4065f-1274-40bf-920d-f88619242f21', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '11', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_38ca674e-a9b8-4e7a-8304-4fe88787ed9c', 'sbm_39a4065f-1274-40bf-920d-f88619242f21', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'cetak gol', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_80bffec7-a087-4679-a78a-8df856520e1f', 'sbm_39a4065f-1274-40bf-920d-f88619242f21', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', 'dribbing', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bad90451-4433-4f46-8ee0-33c277f77631', 'sbm_5c58ace6-6630-4306-ae5d-ee4fe7f64dbe', 'qst_5763a9eb-7b0f-442e-90e9-f472d8502338', 'penyebaran hoax', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_54301995-320f-4eb0-af2d-3aa42753b994', 'sbm_5c58ace6-6630-4306-ae5d-ee4fe7f64dbe', 'qst_d7878d8d-7cf7-45f1-9f05-ab232dc4f975', 'teknologi informasi dan komunikasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2926bf5b-b458-456a-a900-2b96a877fd0d', 'sbm_5c58ace6-6630-4306-ae5d-ee4fe7f64dbe', 'qst_e16591f5-eb34-43c9-a074-c9648e646a39', 'cepat akses informasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cd1d461e-a5fd-480b-94ef-d5d37fca746f', 'sbm_5c58ace6-6630-4306-ae5d-ee4fe7f64dbe', 'qst_f8366849-5f02-470c-a5cd-a650dda13c25', '', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_82c4036a-4811-4220-a933-758a2700ebdc', 'sbm_5c58ace6-6630-4306-ae5d-ee4fe7f64dbe', 'qst_fb82f6f1-8c91-4d92-baa0-3a18fa55f33c', 'cepat akses informasi', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_95a7358d-9fdd-40f1-82dc-995a06732b94', 'sbm_b6d045a1-0469-4613-a803-cc4e0fc7d268', 'qst_0c662c82-d08a-421a-8b6f-0c187edba687', 'bola kaki', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_adf7c33e-c31a-4c4a-8984-b254bf951282', 'sbm_b6d045a1-0469-4613-a803-cc4e0fc7d268', 'qst_1df3e880-6d1e-4b8f-a36a-94751741d98c', 'passing bawah', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_50fa53e2-1c8e-434b-8ea0-3f582e68bd78', 'sbm_b6d045a1-0469-4613-a803-cc4e0fc7d268', 'qst_c4110f4b-b76c-422a-885f-b7a109faca46', '11', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_75703e3a-c20b-46fd-a111-4c58edc47cf7', 'sbm_b6d045a1-0469-4613-a803-cc4e0fc7d268', 'qst_cc02f0ef-f3a8-4572-b9d5-c5cf36cc4b41', 'cetak gol', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f1bc960d-97da-4111-b35a-92d3de5955f3', 'sbm_b6d045a1-0469-4613-a803-cc4e0fc7d268', 'qst_fd9d6589-9053-4405-8922-fdd349ab269a', 'dribbing', NULL, NULL, NULL);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7f3a5b68-b903-468b-baa5-55b593a8d0a7', 'sbm_f6741d09-cbef-4f8b-a210-82712195242d', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '√2/2', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ded5c185-eaf1-4c00-961c-1f4e1c2d08a4', 'sbm_f6741d09-cbef-4f8b-a210-82712195242d', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1f063b54-f582-4373-a972-6c3c42b124fe', 'sbm_f6741d09-cbef-4f8b-a210-82712195242d', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c50b13d5-0b79-4c03-80bb-1fac5bd79794', 'sbm_f6741d09-cbef-4f8b-a210-82712195242d', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9467fbb3-1445-42b5-bd15-89f5d9b65cfd', 'sbm_2ae5e746-2309-4119-917f-2b82194a5ece', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_dc873454-e6c9-4619-838f-346e4e67cf31', 'sbm_2ae5e746-2309-4119-917f-2b82194a5ece', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1b408761-ffb1-4d4c-8eb5-2711efae1e6d', 'sbm_2ae5e746-2309-4119-917f-2b82194a5ece', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_5754f93e-3e3a-44e6-84fa-f842d7e0b091', 'sbm_2ae5e746-2309-4119-917f-2b82194a5ece', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_8bb0f45a-ee74-45a5-b6ab-18e659ead1d6', 'sbm_dd2b9c66-1171-483c-ac25-2713e17bd38c', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_95a6ecfe-9032-4524-a04c-2440c0ab1b9b', 'sbm_dd2b9c66-1171-483c-ac25-2713e17bd38c', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9f9ad405-748d-4b68-9a8b-dd9df11397af', 'sbm_dd2b9c66-1171-483c-ac25-2713e17bd38c', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_53f6223e-d96f-426b-b6b6-95ca36abda7c', 'sbm_dd2b9c66-1171-483c-ac25-2713e17bd38c', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3ff7ab24-82b1-46fc-b01f-1e31ed5ab734', 'sbm_4fe99977-74c5-4c26-b4a4-5246e60c990e', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_65e88677-8a4d-4bd5-942b-ef126d63a63a', 'sbm_4fe99977-74c5-4c26-b4a4-5246e60c990e', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_eb80b0d1-30f2-46a6-ba52-94dce931712a', 'sbm_4fe99977-74c5-4c26-b4a4-5246e60c990e', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_da019c74-6e80-4670-8477-c08868bd4d14', 'sbm_4fe99977-74c5-4c26-b4a4-5246e60c990e', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7d578e04-df55-4395-b2a1-89f0a65606df', 'sbm_e3c8a679-c324-4dd8-a7f6-3815b21a75a3', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_603dd396-dd99-4bc8-b4db-8e1e98de70c4', 'sbm_e3c8a679-c324-4dd8-a7f6-3815b21a75a3', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ec70884a-eca1-4987-821e-fa480ff4b1d5', 'sbm_e3c8a679-c324-4dd8-a7f6-3815b21a75a3', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_eebbe4c8-fc91-4571-babd-6af44575ea32', 'sbm_e3c8a679-c324-4dd8-a7f6-3815b21a75a3', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f696bd65-392d-42da-878b-e30c48a810ec', 'sbm_436ca835-eef3-41f7-b6d8-eac917c34282', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bcff5719-8e68-46d9-9b2a-ab588ddf7ec3', 'sbm_436ca835-eef3-41f7-b6d8-eac917c34282', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'miring/depan', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_5517b0b4-e625-4f31-836b-223ff4ca9599', 'sbm_436ca835-eef3-41f7-b6d8-eac917c34282', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d45c09ad-98ec-4aba-95f5-85d1aa37ade3', 'sbm_436ca835-eef3-41f7-b6d8-eac917c34282', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_fb61ac4d-6a00-4331-857c-467b9bcfd122', 'sbm_4b7171d7-778f-4a41-a57d-cbfcd5533a9e', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_af6b55ce-a4a6-4a8c-a1ae-d94e6b646776', 'sbm_4b7171d7-778f-4a41-a57d-cbfcd5533a9e', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ea20abbf-5d40-4812-a768-2c60bd5aacd4', 'sbm_4b7171d7-778f-4a41-a57d-cbfcd5533a9e', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_0637bd02-7a14-4b76-bde2-a6129a1f8437', 'sbm_4b7171d7-778f-4a41-a57d-cbfcd5533a9e', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b2bafced-69b8-4a95-909d-c6a94f5bddf5', 'sbm_0753ec1b-4f7b-4a07-b244-b90511826d79', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_20b901b5-e22f-4b74-8f33-19a2728bec5a', 'sbm_0753ec1b-4f7b-4a07-b244-b90511826d79', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_29973409-242c-433f-bd60-b8e365555c42', 'sbm_0753ec1b-4f7b-4a07-b244-b90511826d79', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_8318153e-fc95-4a09-a20d-adbfbac6b746', 'sbm_0753ec1b-4f7b-4a07-b244-b90511826d79', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cc3f1d84-5272-4824-adb3-1335a75f9ee1', 'sbm_6f2a3b16-424f-4a97-8c72-4aa0b0cddee4', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_26c6aef9-1665-4d3d-8a17-8a3e880e7a44', 'sbm_6f2a3b16-424f-4a97-8c72-4aa0b0cddee4', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_866ce1ab-1926-4ab7-8f14-66e0aabf8a07', 'sbm_6f2a3b16-424f-4a97-8c72-4aa0b0cddee4', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1964c0d7-4176-43be-8258-27a848c3fc04', 'sbm_6f2a3b16-424f-4a97-8c72-4aa0b0cddee4', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_12c891c8-2a43-4914-834f-a9bc7fc63e71', 'sbm_d111da13-1308-426b-98e8-0eefe9780d2b', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f8b5d9f5-9d04-44f4-9b74-8570303e65c9', 'sbm_d111da13-1308-426b-98e8-0eefe9780d2b', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6975b351-5c13-4dd7-a8f3-d6faedf51d92', 'sbm_d111da13-1308-426b-98e8-0eefe9780d2b', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ac27f1e7-4081-46e4-8171-fdc06c14bbf5', 'sbm_d111da13-1308-426b-98e8-0eefe9780d2b', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_23d2b080-b8bf-4b0b-8ef1-ea8718e0f604', 'sbm_cffacc44-f631-4ac5-ab5a-068aca65478d', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1eb53de2-2046-4f5b-b34c-d8054b9da8e7', 'sbm_cffacc44-f631-4ac5-ab5a-068aca65478d', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6eaeb0e8-f9be-49d5-8700-0b4beb854f30', 'sbm_cffacc44-f631-4ac5-ab5a-068aca65478d', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_015cddce-9053-4a78-b811-5e90662dc27f', 'sbm_cffacc44-f631-4ac5-ab5a-068aca65478d', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a73cf79d-bf95-4b09-8f6e-beceeba67c8c', 'sbm_133681fb-f367-42a9-9e84-2d975f09a3c0', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '√3/2', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_de4135e5-64c1-4a45-9713-e3a280092686', 'sbm_133681fb-f367-42a9-9e84-2d975f09a3c0', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'miring/depan', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b98089cb-6bfc-4f07-b42c-c46d7b6e3d71', 'sbm_133681fb-f367-42a9-9e84-2d975f09a3c0', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_454cc752-4ff5-4dd2-a301-d3aa55a0145c', 'sbm_133681fb-f367-42a9-9e84-2d975f09a3c0', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_dd77db46-719e-4427-9a90-8cea1a06cb6f', 'sbm_73838f67-0fe5-4ba1-a94d-8cf61d10edf0', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7a9aed12-1015-4c4c-b821-43ebc7e1c45f', 'sbm_73838f67-0fe5-4ba1-a94d-8cf61d10edf0', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ff5d6dd6-0348-4c11-ba66-c20d4305c6fc', 'sbm_73838f67-0fe5-4ba1-a94d-8cf61d10edf0', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9869b094-0a42-4fe3-b276-a73e733f962a', 'sbm_73838f67-0fe5-4ba1-a94d-8cf61d10edf0', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_986f53ea-8241-4eae-a558-75c03c808324', 'sbm_0cb197d9-abe0-440e-a157-b2b1cb70f1e4', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_caee32a9-5f63-4144-9572-89628cbcd359', 'sbm_0cb197d9-abe0-440e-a157-b2b1cb70f1e4', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9d17cf42-5177-4bbe-89eb-b01bf15f4342', 'sbm_0cb197d9-abe0-440e-a157-b2b1cb70f1e4', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7adc3a4b-5a58-4af1-9e73-1a15967330c6', 'sbm_0cb197d9-abe0-440e-a157-b2b1cb70f1e4', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_99cb247f-b126-4ea7-a575-3819dd36dbf0', 'sbm_ee18391f-eaca-4572-ab99-09ea8c5815fc', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_989f1908-576d-458f-a561-8cf50c27779d', 'sbm_ee18391f-eaca-4572-ab99-09ea8c5815fc', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_51b065d4-406a-45dc-84a0-f49e0ffdf2d8', 'sbm_ee18391f-eaca-4572-ab99-09ea8c5815fc', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bd86c99f-3bfa-4f15-9d88-48b28fb00652', 'sbm_ee18391f-eaca-4572-ab99-09ea8c5815fc', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3dd81985-0e33-4869-80e9-f5524f04b424', 'sbm_df22a11a-762a-41c1-8c58-5f09c615d92f', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '√2/2', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_72fc8468-9071-4408-bcea-430154c7c614', 'sbm_df22a11a-762a-41c1-8c58-5f09c615d92f', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d164084d-9104-4413-8fa6-d845efd2e542', 'sbm_df22a11a-762a-41c1-8c58-5f09c615d92f', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d8fa99dd-c6c5-4dcd-85db-e10a265f053a', 'sbm_df22a11a-762a-41c1-8c58-5f09c615d92f', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_476a44a3-82b8-49ca-84f1-450b869100b6', 'sbm_a6abae58-4281-43b3-afab-2d16b1c64724', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '√3/2', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_79c91be6-5367-4df3-b614-ed87b489dc71', 'sbm_a6abae58-4281-43b3-afab-2d16b1c64724', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_11e25b51-9c49-41e9-a522-55bec497ce69', 'sbm_a6abae58-4281-43b3-afab-2d16b1c64724', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f4f320c1-0065-42e6-ab07-345c9179f1bd', 'sbm_a6abae58-4281-43b3-afab-2d16b1c64724', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_eabcaed3-9432-491a-b7d8-b15a071a8067', 'sbm_3c8f48ee-e890-4056-9ea3-f3ca75a02dc7', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_79c9decd-1451-421e-ab7f-e106d969ec15', 'sbm_3c8f48ee-e890-4056-9ea3-f3ca75a02dc7', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_55cc7240-9f34-4054-9d11-8e176fcdf812', 'sbm_3c8f48ee-e890-4056-9ea3-f3ca75a02dc7', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6cf583c5-cc06-4e75-8c72-357ab5b24017', 'sbm_3c8f48ee-e890-4056-9ea3-f3ca75a02dc7', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d033de17-8841-4694-a364-a262e16908ad', 'sbm_036609d9-a738-490e-a9ca-9271edcc560b', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c460adf6-4ac2-41be-b6bb-af0dd5a5b399', 'sbm_036609d9-a738-490e-a9ca-9271edcc560b', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_170573d6-74b5-40b5-bce1-e12317ef2281', 'sbm_036609d9-a738-490e-a9ca-9271edcc560b', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ea566ffd-6a33-4f7a-bf83-9f25cbad6724', 'sbm_036609d9-a738-490e-a9ca-9271edcc560b', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_79be4b0a-d303-486f-969d-d601c1523737', 'sbm_2fb9ea6a-71cf-4111-be2b-b4b9ba5b8eee', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c45bf544-f7b3-4f20-aa5b-194c5de663fe', 'sbm_2fb9ea6a-71cf-4111-be2b-b4b9ba5b8eee', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3bff9581-977f-4aaf-82d3-a2436e5bad03', 'sbm_2fb9ea6a-71cf-4111-be2b-b4b9ba5b8eee', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2971a204-192a-4d43-8db0-ad2ebb01701f', 'sbm_2fb9ea6a-71cf-4111-be2b-b4b9ba5b8eee', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b93643e8-4ac8-4f05-804e-286e9012628c', 'sbm_18480847-83a2-40e9-a1d6-f3edcd24b046', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f9a68b15-436e-497e-99c4-a3f85481d852', 'sbm_18480847-83a2-40e9-a1d6-f3edcd24b046', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_677ef776-ffea-431b-990d-cfa783eacb04', 'sbm_18480847-83a2-40e9-a1d6-f3edcd24b046', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_307c17be-0387-4151-811b-a55572857075', 'sbm_18480847-83a2-40e9-a1d6-f3edcd24b046', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_10c63160-6ac3-43f2-bea3-dd1392c990b2', 'sbm_01b89376-db30-42dd-9254-176518526393', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_3b5bccbb-2787-47c2-8a74-b2f7ced4ac87', 'sbm_01b89376-db30-42dd-9254-176518526393', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_29a17736-5156-4a89-a151-407c40afcec6', 'sbm_01b89376-db30-42dd-9254-176518526393', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d9319194-9db4-47d1-aded-bd7333a1eede', 'sbm_01b89376-db30-42dd-9254-176518526393', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_8dac95a6-b6cc-44ea-9317-a9bc6da20d93', 'sbm_f9674ce4-b61f-4f8d-8c18-a4e42698e057', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_fe4e1388-bc1d-4183-9ee2-6d6245beaba1', 'sbm_f9674ce4-b61f-4f8d-8c18-a4e42698e057', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a2531aa5-c182-4b06-9bdb-59ed15b4dcd0', 'sbm_f9674ce4-b61f-4f8d-8c18-a4e42698e057', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cd4cf176-6860-4397-88fe-72659830108d', 'sbm_f9674ce4-b61f-4f8d-8c18-a4e42698e057', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_62d74b7b-0aea-4de0-91f1-2a923efecfb5', 'sbm_59ac11b6-ffb9-4be1-95ff-5903c20c5ae6', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_0b4ac01f-f2af-493f-afcc-aa177e89faec', 'sbm_59ac11b6-ffb9-4be1-95ff-5903c20c5ae6', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'samping/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f411b9d6-41e2-402e-9660-b5f820556b2e', 'sbm_59ac11b6-ffb9-4be1-95ff-5903c20c5ae6', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_15434321-5eb5-4ff6-a384-87bfe2e1af19', 'sbm_59ac11b6-ffb9-4be1-95ff-5903c20c5ae6', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_98a0adbc-f1c5-4455-926b-5f3c68fd7673', 'sbm_98d77574-decd-4bfa-8f41-c50b020f47f2', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9b2ea3f5-4c67-49e1-a57f-fb5defb52e40', 'sbm_98d77574-decd-4bfa-8f41-c50b020f47f2', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1c78838d-2ec9-4e44-a25f-3313dbc4d9bb', 'sbm_98d77574-decd-4bfa-8f41-c50b020f47f2', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bd00cfcd-9ddc-47e0-b8ce-73e3133b15b8', 'sbm_98d77574-decd-4bfa-8f41-c50b020f47f2', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b6907c2e-cc36-41a0-87b7-525c0da1421c', 'sbm_3091a669-6649-47fa-9082-8d808c87f884', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f37ca3ba-8fa6-4314-953d-5f0a66d0a67a', 'sbm_3091a669-6649-47fa-9082-8d808c87f884', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c8291304-61a4-4dd8-818a-b6dafba13f4e', 'sbm_3091a669-6649-47fa-9082-8d808c87f884', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_569e6bcb-acc5-430b-a8f9-dac067564391', 'sbm_3091a669-6649-47fa-9082-8d808c87f884', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_336a9347-e2be-4ba7-a295-5bbe8ba5f269', 'sbm_1b746fdf-88e7-452f-b490-fab96a5a13b9', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_64bfb930-c6ce-43b9-8a09-77113956f81d', 'sbm_1b746fdf-88e7-452f-b490-fab96a5a13b9', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_8d3571b3-a3ea-4f66-b034-609d13b0799c', 'sbm_1b746fdf-88e7-452f-b490-fab96a5a13b9', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c36b2ace-30be-40fe-b4f6-d6d86cc8de6f', 'sbm_1b746fdf-88e7-452f-b490-fab96a5a13b9', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_9f95a8e7-9d51-4335-bbdd-3e9c4ee99dd6', 'sbm_7a434049-863d-42f1-997d-d2d792ccf1e1', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_16fefec7-cad6-443b-88a5-1e45462f88a4', 'sbm_7a434049-863d-42f1-997d-d2d792ccf1e1', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_66e4eea1-7501-4ffd-9f70-56b2383985bb', 'sbm_7a434049-863d-42f1-997d-d2d792ccf1e1', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ce438b15-e01d-4e55-a2c6-f5248cc718ef', 'sbm_7a434049-863d-42f1-997d-d2d792ccf1e1', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_20f5fc9e-f20c-4f35-97c5-47136017b080', 'sbm_47c0af45-8c6c-40e8-9a95-0eb840f29cb3', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bc2a8853-f285-4d89-b0cc-da45dfa3fd4c', 'sbm_47c0af45-8c6c-40e8-9a95-0eb840f29cb3', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2c86d3f8-5327-439d-997c-052b0e2e323c', 'sbm_47c0af45-8c6c-40e8-9a95-0eb840f29cb3', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_22499634-214d-4dc5-ac58-885b69ddc91b', 'sbm_47c0af45-8c6c-40e8-9a95-0eb840f29cb3', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2a4ac2c8-c025-4621-9311-2e1ac05a6f48', 'sbm_dee53414-3e27-46b3-b243-edaee8a0577c', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ac538855-c4d2-4a70-8d7d-4844e5804148', 'sbm_dee53414-3e27-46b3-b243-edaee8a0577c', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/miring', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7a1756f2-8444-427a-95bd-614d9fb732f6', 'sbm_dee53414-3e27-46b3-b243-edaee8a0577c', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_6d301488-f886-4b2d-b30a-49ddda0cb477', 'sbm_dee53414-3e27-46b3-b243-edaee8a0577c', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_93f61f46-27b3-49e5-84f0-657be65296b0', 'sbm_b1cc4248-fd23-42bf-a3c8-97f321fe85a2', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4786a67e-7482-40d6-a04f-1dd5f50ab33c', 'sbm_b1cc4248-fd23-42bf-a3c8-97f321fe85a2', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_674fa887-004a-4607-975b-1d99012e282b', 'sbm_b1cc4248-fd23-42bf-a3c8-97f321fe85a2', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4d487a69-aef2-414f-809a-d00fcc6c843d', 'sbm_b1cc4248-fd23-42bf-a3c8-97f321fe85a2', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_95666b36-5fa0-48a5-a862-7a3be49e4fba', 'sbm_83ffb023-eb92-4548-a65b-ac8b79636f66', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1/2', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_4ccea0fb-fd9d-4386-9edf-c67f2e1c869e', 'sbm_83ffb023-eb92-4548-a65b-ac8b79636f66', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'depan/samping', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_586276da-2851-40ed-a638-bbb2124c54b2', 'sbm_83ffb023-eb92-4548-a65b-ac8b79636f66', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_0cd6ed2c-3dfc-46b1-868f-0a122c8feff0', 'sbm_83ffb023-eb92-4548-a65b-ac8b79636f66', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', '1', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_d132eb41-9602-496b-b141-7476f6600eb8', 'sbm_8406d76a-89f2-4ef9-b914-47d8f283eb04', 'qst_68404b07-9c75-4b67-af3b-021e135f3a71', '1', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_0bbb3549-71a4-4d4c-a6eb-87435f8e9cc3', 'sbm_8406d76a-89f2-4ef9-b914-47d8f283eb04', 'qst_b867bfb2-cc75-4553-8363-3f4aa6c69157', 'miring/depan', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2e6e5595-8c27-4ea5-b876-41b1529bc218', 'sbm_8406d76a-89f2-4ef9-b914-47d8f283eb04', 'qst_50bf60c7-617c-4731-89b8-1aa638b598db', 'Benar', true, NULL, 25);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_cf433c48-8db1-4d4b-85b1-f02ba122d3e8', 'sbm_8406d76a-89f2-4ef9-b914-47d8f283eb04', 'qst_d2063d7f-0ac9-4e90-a896-53e1e448ef19', 'Jawaban kurang tepat', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a3d11c40-04a2-4112-b472-ca18c03252f0', 'sbm_9c6b0352-a7a2-4e9e-9f6e-6a63468a5abc', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menghibur pembaca', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b6c8aea7-6360-402e-ac92-517aff95a344', 'sbm_9c6b0352-a7a2-4e9e-9f6e-6a63468a5abc', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1c19ab1d-769d-4933-bb6b-4364ecdb17a0', 'sbm_9c6b0352-a7a2-4e9e-9f6e-6a63468a5abc', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 26.57307764935219);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_2c227585-5cb0-4883-b319-b07145c3ae0c', 'sbm_40577eed-60e9-43a0-b306-f23a5b6ecb5a', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menjelaskan informasi', true, NULL, 30);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_c9ddabf3-b54d-4b72-ba10-d705dc91fba6', 'sbm_40577eed-60e9-43a0-b306-f23a5b6ecb5a', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Benar', true, NULL, 35);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f31c9d63-7d8c-4c49-82d9-71e77a510f1e', 'sbm_40577eed-60e9-43a0-b306-f23a5b6ecb5a', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 24.48422957090791);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a8254ab4-8079-4bd6-86f2-8ad364b196f9', 'sbm_f753ec3e-99cd-4c75-bcff-2ec7dab6236d', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menjelaskan informasi', true, NULL, 30);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1cc93614-a1bb-45db-81c8-54acd3ee5880', 'sbm_f753ec3e-99cd-4c75-bcff-2ec7dab6236d', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ed0a435a-eac7-49ae-85e7-61b39d570d97', 'sbm_f753ec3e-99cd-4c75-bcff-2ec7dab6236d', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 25.58538417641656);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_b37ccf80-1b46-4cd5-950a-c0681c10d9be', 'sbm_d337820a-fdbf-4f41-9ea0-16eea9ecd726', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menjelaskan informasi', true, NULL, 30);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_1676d54e-3fcd-40b3-9704-ac7869f37b96', 'sbm_d337820a-fdbf-4f41-9ea0-16eea9ecd726', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Benar', true, NULL, 35);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_bce82219-cfdf-4c04-b420-06ee1416b601', 'sbm_d337820a-fdbf-4f41-9ea0-16eea9ecd726', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 29.05437854351412);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_7798ff4a-9b47-414c-9b65-8f37e9ec50ac', 'sbm_024e6d88-4509-4456-9a1d-201ff6fc4651', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menceritakan pengalaman', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_694ad842-1482-403a-afd2-6d5337c8378f', 'sbm_024e6d88-4509-4456-9a1d-201ff6fc4651', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Salah', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a73b4552-dd2b-4c41-8462-881cb62b6fb4', 'sbm_024e6d88-4509-4456-9a1d-201ff6fc4651', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 25.31375856818189);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a4827567-0f29-4e20-9b33-dfe9ede78a58', 'sbm_470aef42-0a10-4aac-b048-102606899606', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menceritakan pengalaman', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_04a35669-ff38-40e5-ad20-dc9f2afc2bde', 'sbm_470aef42-0a10-4aac-b048-102606899606', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Benar', true, NULL, 35);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_ab21af56-2569-485b-a812-4d7b2b16306c', 'sbm_470aef42-0a10-4aac-b048-102606899606', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 21.79402278096961);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_19ce322a-2034-45a8-b6ea-d0b7d37fad9b', 'sbm_9f5a6a9a-b1e2-4030-a5ef-4eef5f8fedc1', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menjelaskan informasi', true, NULL, 30);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_479b5e27-6a85-4217-8ad3-7a0a9f37e023', 'sbm_9f5a6a9a-b1e2-4030-a5ef-4eef5f8fedc1', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Benar', true, NULL, 35);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_943596e8-151f-4543-b690-ea9e162edb0e', 'sbm_9f5a6a9a-b1e2-4030-a5ef-4eef5f8fedc1', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 25.90241754326459);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f7ba55eb-4719-4fb3-bd84-d9888d41d9ae', 'sbm_2906177e-6571-4a45-a072-e7e223517f97', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menceritakan pengalaman', false, NULL, 0);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_a55a29c0-6716-46f4-9211-1fda10c961cd', 'sbm_2906177e-6571-4a45-a072-e7e223517f97', 'qst_986afe82-cfe0-4db4-b471-874bde63e365', 'Benar', true, NULL, 35);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_f8207da3-c132-446a-94a3-232c436f9b3f', 'sbm_2906177e-6571-4a45-a072-e7e223517f97', 'qst_7760a111-0704-4576-bef5-ab2519c63ef9', 'Jawaban essay siswa mengenai topik ini. Lorem ipsum dolor sit amet, consectetur adipiscing elit.', NULL, NULL, 32.59089386265601);
INSERT INTO public."Answer" (id, "submissionId", "questionId", jawaban, "adalahBenar", feedback, nilai) VALUES ('ans_fd92cdb9-e5c2-4016-921b-c2f00ec380e3', 'sbm_db0445c5-cb7e-4c3b-bdbc-afccad7db77b', 'qst_9a30964d-1006-4820-a1b1-f4587fe0452e', 'Menjelaskan informasi', true, NULL, 30);