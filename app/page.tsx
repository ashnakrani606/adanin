"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ShieldCheck,
  FileText,
  Hospital,
  HeartPulse,
  Lock,
  Stethoscope,
  Languages,
  X,
  Sparkles,
  Layers,
  ListChecks,
  MapPin,
  Pill,
  CalendarClock,
  UserCheck,
  Eye,
  Send,
  User,
  Earth,
  CircleCheck,
  GitCompare,
  LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import { content, type Lang } from "./lang";
import Link from "next/link";
import Image from "next/image";
import Report from "../public/report.png"
import Access from "../public/access.png"
import HealthPassport from "../public/health-passport.png"
type Role = "patient" | "doctor" | "clinic";
type ChatMessage = { role: "user" | "assistant"; text: string };
const FREE_LIMIT = 10;

export default function Home() {
  const [language, setLanguage] = useState<Lang>("en");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("patient");
  const [message, setMessage] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const [freeQuestionsLeft, setFreeQuestionsLeft] = useState(FREE_LIMIT);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  // Treatment Request form state
  const [trName, setTrName] = useState("");
  const [trEmail, setTrEmail] = useState("");
  const [trPhone, setTrPhone] = useState("");
  const [trCountryRes, setTrCountryRes] = useState("");
  const [trTreatment, setTrTreatment] = useState("");
  const [trPreferred, setTrPreferred] = useState("");
  const [trTimeline, setTrTimeline] = useState("");
  const [trBudget, setTrBudget] = useState("");
  const [trMessage, setTrMessage] = useState("");
  const [trSubmitted, setTrSubmitted] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const t = content[language];

  useEffect(() => {
    const saved = localStorage.getItem("adamiani_registered");
    if (saved === "true") setIsRegistered(true);

    const savedQuestions = localStorage.getItem("adamiani_questions_left");
    if (savedQuestions !== null) {
      const parsed = Number.parseInt(savedQuestions, 10);
      if (!Number.isNaN(parsed)) setFreeQuestionsLeft(parsed);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("adamiani_questions_left", String(freeQuestionsLeft));
  }, [freeQuestionsLeft]);

  useEffect(() => {
    const container = chatEndRef.current?.parentElement;
    if (container) container.scrollTop = container.scrollHeight;
  }, [chatMessages]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const savePatientInquiry = async () => {
    if (!trName.trim() || !trPhone.trim() || !trCountryRes.trim() || !trTreatment.trim()) {
      alert(t.trFillRequired);
      return;
    }
    const { error } = await supabase.from("patient_inquiries").insert([
      {
        name: trName.trim(),
        email: trEmail.trim() || null,
        phone: trPhone.trim(),
        country_of_residence: trCountryRes.trim() || null,
        treatment_needed: trTreatment.trim(),
        preferred_country: trPreferred.trim() || null,
        timeline: trTimeline || null,
        budget_range: trBudget.trim() || null,
        message: trMessage.trim() || null,
        language,
        status: "new",
      },
    ]);

    if (error) {
      console.error(error);
      alert(t.error);
      return;
    }
    setTrSubmitted(true);
    setTrName("");
    setTrEmail("");
    setTrPhone("");
    setTrCountryRes("");
    setTrTreatment("");
    setTrPreferred("");
    setTrTimeline("");
    setTrBudget("");
    setTrMessage("");
  };

  const saveEmail = async () => {
    if (!name.trim() || !email.trim()) {
      alert(t.fillAll);
      return;
    }
    const { error } = await supabase.from("waitlist").insert([
      {
        name: name.trim(),
        email: email.trim(),
        role,
        user_type: role,
        source: "adamiani_cross_border_homepage",
      },
    ]);

    if (error && error.code !== "23505") {
      console.error(error);
      alert(t.error);
      return;
    }

    setIsRegistered(true);
    setShowRegisterModal(false);
    localStorage.setItem("adamiani_registered", "true");
    setEmail("");
    setName("");
    setRole("patient");
  };
  const sendMessage = async (text?: string) => {
    const userMessage = (text ?? message).trim();
    if (!userMessage) return;
    if (!isRegistered) {
      setShowRegisterModal(true);
      return;
    }
    if (freeQuestionsLeft <= 0) {
      setChatMessages((prev) => {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg?.text === t.chatLimitReached) return prev;
        return [...prev, { role: "assistant", text: t.chatLimitReached }];
      });
      setTimeout(() => scrollTo("waitlist"), 1200);
      return;
    }
    setMessage("");
    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: userMessage },
      { role: "assistant", text: "..." },
    ]);
    setFreeQuestionsLeft((prev) => prev - 1);
    try {
      const conversation = [
        ...chatMessages.map((m) => ({ role: m.role, content: m.text })),
        { role: "user", content: userMessage },
      ];
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation, language }),
      });

      const data = await res.json();
      const reply = data.reply || t.chatDemoReply;

      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: reply };
        return updated;
      });
    } catch (error) {
      console.error(error);
      setChatMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", text: t.chatDemoReply };
        return updated;
      });
    }
  };
  const handleSuggestionClick = (question:any) => {
    setMessage(question);
    sendMessage(question);
  };
  const RoleButton = ({
    value,
    label,
    icon: Icon,
    dark = false,
  }: {
    value: Role;
    label: string;
    icon?: LucideIcon;
    dark?: boolean;
  }) => (
    <button
      type="button"
      onClick={() => setRole(value)}
      className={`flex flex-col cursor-pointer items-center gap-2 rounded-[15px] border border-hairline hover:border-accent-teal transition-all duration-500 sm:px-12 sm:py-4 xs:p-5 p-4 text-sm font-semibold ${role === value
        ? "bg-accent-blue  hover:border-accent-blue text-cream"
        : dark
          ? "bg-cream text-dark-grayish-blue hover:bg-white/20"
          : "bg-[#EAF5FF] text-[#50677F] hover:bg-[#EAF5FF]"
        }`}
    >
      {Icon && (
        <Icon
          className={`h-4 w-4 ${role === value ? "text-cream" : "text-accent-blue"
            }`}
        />
      )}
      <span>{label}</span>
    </button>
  );

  useEffect(() => {
    document.body.classList.toggle("max-[1024px]:overflow-hidden", isOpen);
    return () => {
      document.body.classList.remove("max-[1024px]:overflow-hidden");
    };
  }, [isOpen]);
  return (
    <>
      <div className="relative min-h-screen scroll-smooth bg-cream text-ink">
        {/* header start */}
        <div className="sticky w-full top-0 border-b border-hairline py-3.75 z-9999 bg-cream">
          <nav className="max-w-360 w-full mx-auto flex items-center justify-between px-4 md:px-6 lg:px-8 ">
            <Link href="/" onClick={() => scrollTo("home")}>
              <Image
                src="/logo.svg"
                alt="Adamiani.AI"
                width={156}
                height={28}
                className="sm:max-w-full max-w-30"
              />
            </Link>
            <div className="hidden lg:flex items-center gap-8 text-[13px] font-medium text-[#50677F]">
              {[
                { label: t.nav[0], href: "how-it-work" },
                { label: t.nav[1], href: "treatment-request" },
                { label: t.nav[2], href: "passport" },
                { label: t.nav[3], href: "trust" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => scrollTo(item.href)}
                  className="transition cursor-pointer hover:text-accent-blue "
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                {["en", "ru", "ka"].map((lang: any, index) => (
                  <div
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`cursor-pointer text-xs font-medium ${language === lang ? "text-ink" : "text-dark-grayish-blue"}`}
                  >
                    {lang.toUpperCase()}
                    {index !== 2 && (
                      <span className="pl-1.25 pr-1.5 text-hairline">/</span>
                    )}
                  </div>
                ))}
              </div>
              <Link
                href="/"
                className="hidden lg:flex items-center gap-2 rounded-full group bg-accent-blue hover:bg-accent-teal transition-all duration-500 text-white px-5 py-2.5 text-sm"
              >
                {t.startCase}
                <ArrowRight className="h-4 w-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
              </Link>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative flex h-6 w-6 items-center justify-center lg:hidden"
                aria-label={isOpen ? "Close menu" : "Open menu"}
              >
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-dark-grayish-blue transition-all duration-300 ease-in-out ${isOpen ? "rotate-45" : "-translate-y-1.5"
                    }`}
                />
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-dark-grayish-blue transition-all duration-300 ease-in-out ${isOpen ? "opacity-0" : "opacity-100"
                    }`}
                />
                <span
                  className={`absolute h-0.5 w-5 rounded-full bg-dark-grayish-blue transition-all duration-300 ease-in-out ${isOpen ? "-rotate-45" : "translate-y-1.5"
                    }`}
                />
              </button>
            </div>
          </nav>
        </div>
        <div className={`lg:hidden bg-cream fixed transition-all duration-500 w-full left-0 border-b border-hairline z-999 shadow-[0_1px_3px_rgba(6,28,46,0.0509804),0_24px_60px_-20px_rgba(6,28,46,0.180392)] ${isOpen ? "top-14.75" : "-top-100"}`}>
          <div className="flex flex-col p-6 gap-8">
            <div className="flex flex-col items-start gap-5 text-[13px] font-medium text-[#50677F]">
              {[
                { label: t.nav[0], href: "how-it-work" },
                { label: t.nav[1], href: "treatment-request" },
                { label: t.nav[2], href: "passport" },
                { label: t.nav[3], href: "trust" },
              ].map((item) => (
                <button
                  key={item.href}
                  onClick={() => { scrollTo(item.href); setIsOpen(false) }}
                  className="transition"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Link
              href="/"
              className="group flex items-center gap-2 rounded-full bg-accent-blue hover:bg-accent-teal text-white px-5 py-2.5 text-sm w-fit"
              onClick={() => setIsOpen(false)}
            >
              Start a case
              <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
        {/* header end */}
        <main className="relative min-h-screen scroll-smooth ">
          {/* home section start */}
          <section id="home" className="relative">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:grid flex grid-cols-12 lg:items-start items-center xl:gap-16.5 gap-7.5 md:pt-24 sm:pt-16 pt-10 max-w-360 mx-auto sm:px-8 px-4 laptop:flex-nowrap flex-wrap"
            >
              <div className="lg:col-span-7 lg:max-w-full laptop:max-w-[calc(100%-300px)] w-full">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em]  text-dark-grayish-blue font-semibold uppercase ">{t.heroBadge}</span>
                </div>
                <h1 className="text-[32px] sm:text-[40px] md:text-[48px] laptop:text-[60px] lg:text-[68px] font-semibold leading-[1.08] text-ink font-display sm:mt-7 mt-5 tracking-[-1.36%]" dangerouslySetInnerHTML={{ __html: t.title }}></h1>
                <p className="laptop:mt-9.5 mt-5 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.description}</p>
                <div className="laptop:mt-7.75 mt-4 flex gap-3 items-center laptop:flex-nowrap flex-wrap-reverse">
                  <Link
                    href="/"
                    className="group flex items-center gap-1.75 rounded-full bg-accent-blue hover:bg-accent-teal transition-all  duration-500 text-cream font-semibold px-6 py-4 text-[13px]  w-fit"
                  >
                    {t.primaryCta}
                    <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
                  </Link>
                  <Link href="" className="text-ink text-[13px] font-semibold  tracking-[0.0025em] underline underline-offset-8 decoration-hairline">{t.secondaryCta}</Link>
                </div>
                <div className="sm:mt-12 mt-5 border-t border-hairline pt-6.75 grid xs:grid-cols-3 grid-cols-1 gap-5">
                  {t.features.map((feature: any, index: any) => (
                    <div key={index}>
                      <h5 className="tracking-[-0.0038em] leading-3.75 text-[15px] font-display font-medium mb-1">{feature.title}</h5>
                      <p className="text-xs font-medium text-dark-grayish-blue tracking-[-0.0038em] leading-3.75 ">{feature.subtitle}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative lg:col-span-5 lg:max-w-full laptop:max-w-100 w-full mx-auto">
                <div className="relative">
                  <Image src={Report} alt="Report" className="rounded-sm w-full" />
                  <div className="bg-white absolute shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)] rounded-full pl-3.25 pr-4.5 py-2.5 flex items-center gap-2 top-9.5 -left-3 z-99">
                    <ShieldCheck className="text-accent-blue w-3.5 h-3.5" />
                    <p className="text-[11px] font-semibold text-ink tracking-[-0.0038em]">{t.consentBasedSharing}</p>
                  </div>
                  <div className="bg-white absolute shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)] rounded-full pl-3.25 pr-4.5 py-2.5 flex items-center gap-2 -right-3 top-1/3 z-99">
                    <Layers className="text-accent-blue w-3.5 h-3.5" />
                    <p className="text-[11px] font-semibold text-ink tracking-[-0.0038em]">{t.structuredCaseFormat}</p>
                  </div>
                  <div className="bg-white absolute shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)] rounded-full pl-3.25 pr-4.5 py-2.5 flex items-center gap-2 -bottom-4 left-6 z-99">
                    <Lock className="text-accent-blue w-3.5 h-3.5" />
                    <p className="text-[11px] font-semibold text-ink tracking-[-0.0038em]">{t.privacyFirstProcess}</p>
                  </div>
                  <div className="w-full absolute bottom-0 left-0 py-11 px-5.5 flex flex-col justify-end rounded-[0_0_4px_4px]">
                    <h5 className="text-[11px] leading-[13.6px] tracking-[0.1606em] mb-2.5 text-cream/75 uppercase  font-semibold">{t.howItWorksTitle}</h5>
                    <p className="text-base font-semibold text-white leading-[1.2]">{t.howItWorksSubtitle}</p>
                  </div>
                </div>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="border-t border-b border-hairline md:mt-20 mt-14 py-7.25">
              <div className=" max-w-360 mx-auto sm:px-8 px-4 flex justify-between items-center sm:gap-10 gap-6 sm:flex-nowrap flex-wrap">
                <p className="font-display font-semibold uppercase tracking-[0.2869em] text-[11px] text-dark-grayish-blue text-nowrap">{t.whatAdamianiProvidesTitle}</p>
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  {[
                    { icon: FileText, title: t.whatAdamianiProvides[0].title },
                    { icon: Hospital, title: t.whatAdamianiProvides[1].title },
                    { icon: Stethoscope, title: t.whatAdamianiProvides[2].title },
                    { icon: HeartPulse, title: t.whatAdamianiProvides[3].title },
                    { icon: ShieldCheck, title: t.whatAdamianiProvides[4].title },
                  ].map(({ icon: Icon, title }) => (
                    <div
                      key={title}
                      className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
                    >
                      <span
                        key={title}
                        className="inline-flex items-center gap-2 text-sm text-dark-grayish-blue font-medium "
                      >
                        <Icon
                          className="h-4 w-4 text-accent-blue"
                          strokeWidth={1.75}
                        />
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </section>
          {/* home section start */}
          {/* How it works section start */}
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="bg-white py-10 sm:py-15 md:py-22 lg:py-28 border-b border-hairline" id="how-it-work">
            <div className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-6 laptop:grid-cols-12 lg:gap-10">
              <div className="laptop:col-span-5">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.howItWorksSectionSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-7 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.howItWorksSectionTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.howItWorksSectionDescription}</p>
              </div>
              <div className="laptop:col-span-7">
                <ul>
                  {[
                    {
                      icon: FileText,
                      ...t.howItWorksSteps[0],
                    },
                    {
                      icon: Hospital,
                      ...t.howItWorksSteps[1],
                    },
                    {
                      icon: Stethoscope,
                      ...t.howItWorksSteps[2],
                    },
                    {
                      icon: HeartPulse,
                      ...t.howItWorksSteps[3],
                    },
                  ].map(({ icon: Icon, number, title, description }) => (
                    <div key={number} className="grid grid-cols-12 gap-2.5 md:py-7 py-4 border-t border-hairline last:border-b">
                      <span className="text-sm font-semibold text-accent-blue col-span-2 font-display tracking-[0.2552em]">
                        {number}
                      </span>
                      <div className="col-span-8">
                        <h3 className="sm:text-xl text-lg font-semibold font-display text-ink mb-2">
                          {title}
                        </h3>

                        <p className="mt-2 text-[15px] font-medium tracking-[-0.0038em] text-dark-grayish-blue ">
                          {description}
                        </p>
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <div className="flex h-10 w-10 border border-hairline  items-center justify-center rounded-sm  text-accent-blue col-span-2">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  ))}
                </ul>
              </div>
            </div>
          </motion.section>
          {/* How it works section end */}
          <section id="treatment-request" className="relative py-10 sm:py-15 md:py-22 lg:py-28 bg-dark-teal">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-10 laptop:grid-cols-12 lg:gap-16">
              <div className="laptop:col-span-5">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-accent-teal h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-cream/60 font-semibold uppercase ">{t.treatmentRequestSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-cream font-display sm:mt-7 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.treatmentRequestTitle }}></h2>
                <p className="laptop:mt-6 mt-4 sm:text-base text-sm leading-normal text-cream/75 lg:max-w-143.25 w-full">{t.treatmentRequestDescription}</p>
                <div className="mt-10 border-t border-cream/12 pt-8 flex flex-col gap-4">
                  {[
                    {
                      icon: Lock,
                      title: t.treatmentRequestFeatures[0].title,
                    },
                    {
                      icon: ShieldCheck,
                      title: t.treatmentRequestFeatures[1].title,
                    },
                    {
                      icon: Stethoscope,
                      title: t.treatmentRequestFeatures[2].title,
                    },
                  ].map(({ icon: Icon, title }) => (

                    <div
                      key={title}
                      className="text-[0.85rem] flex gap-3 items-center "
                    >
                      <div className="w-8 h-8 bg-cream/10 flex  items-center justify-center rounded-sm">
                        <Icon
                          className="h-4 w-4 text-accent-teal"
                          strokeWidth={1.75}
                        />
                      </div>
                      <span className="text-cream text-[15px] leading-[1.6]">
                        {title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="laptop:col-span-7">
                <div className="rounded-sm h-full bg-cream sm:py-10 py-6 shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)]">
                  {trSubmitted ? (
                    <div className="sm:p-10 p-5 py-3 text-center flex flex-col items-center sm:gap-8 gap-4 h-full justify-center">
                      <div className="flex h-14 max-w-14 w-full border border-hairline  bg-white items-center justify-center rounded-sm  text-accent-blue">
                        <ShieldCheck className="h-5 w-5" />
                      </div>
                      <p className="sm:text-lg text-base font-semibold leading-8 text-[#062A4F]">{t.trSuccess}</p>
                    </div>
                  ) : (
                    <div>
                      <div className="sm:px-10 xs:px-6 px-4 sm:pb-9  pb-6 border-b border-hairline">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-9 w-9 border border-hairline  bg-white items-center justify-center rounded-sm  text-accent-blue">
                            <User className="w-4 h-4" />
                          </div>
                          <p className="text-[17px] font-display text-ink font-medium leading-[1.706]">{t.aboutYouTitle}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.nameLabel} <span className="text-accent-blue">*</span></label>
                            <input
                              type="text"
                              value={trName}
                              onChange={(e) => setTrName(e.target.value)}
                              placeholder={t.namePlaceholder}
                              className="rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.phoneLabel} <span className="text-accent-blue">*</span></label>
                            <input
                              type="tel"
                              value={trPhone}
                              onChange={(e) => setTrPhone(e.target.value)}
                              placeholder={t.phonePlaceholder}
                              className="rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-2.5 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.emailLabel} </label>
                            <input
                              type="email"
                              value={trEmail}
                              onChange={(e) => setTrEmail(e.target.value)}
                              placeholder={t.emailPlaceholder}
                              className="rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 text-[#062A4F] outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                        </div>
                        <p className="leading-[1.167] mt-2.5 text-xs text-dark-grayish-blue">{t.contactNote}</p>
                      </div>
                      <div className="sm:px-10 xs:px-6 px-4  sm:py-9  py-6 border-b border-hairline">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-9 w-9 border border-hairline  bg-white items-center justify-center rounded-sm  text-accent-blue">
                            <Earth className="w-4 h-4" />
                          </div>
                          <p className="text-[17px] font-display text-ink font-medium leading-[1.706]">{t.locationDestinationTitle}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.countryLabel} <span className="text-accent-blue">*</span></label>
                            <input
                              type="text"
                              value={trCountryRes}
                              onChange={(e) => setTrCountryRes(e.target.value)}
                              placeholder={t.destinationPlaceholder}
                              className="rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 text-[#062A4F] outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.destinationLabel}</label>
                            <select
                              value={trPreferred}
                              onChange={(e) => setTrPreferred(e.target.value)}
                              className={`rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 outline-none focus:border-accent-teal ${trPreferred ? "text-ink" : "text-dark-grayish-blue"}`}
                            >
                              <option value="">{t.trPreferred}</option>
                              {t.trPreferredOpts.map((opt, index) => (
                                <option key={index} value={opt} className="text-[#062A4F]">{opt}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="sm:px-10 xs:px-6 px-4  sm:py-9  py-6 border-b border-hairline">
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex h-9 w-9 border border-hairline  bg-white items-center justify-center rounded-sm  text-accent-blue">
                            <Stethoscope className="w-4 h-4" />
                          </div>
                          <p className="text-[17px] font-display text-ink font-medium leading-[1.706]">{t.yourCaseTitle}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-5">
                          <div className="flex flex-col gap-2.5 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.treatmentNeededLabel} <span className="text-accent-blue">*</span></label>
                            <select
                              value={trTreatment}
                              onChange={(e) => setTrTreatment(e.target.value)}
                              className={`rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 outline-none focus:border-accent-teal ${trTreatment ? "text-ink" : "text-dark-grayish-blue"}`}
                            >
                              <option value="">{t.trTreatment}</option>
                              {t.trTreatmentOpts.map((opt, index) => (
                                <option key={index} value={opt} className="text-[#062A4F]">{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.treatmentTimingLabel} </label>
                            <select
                              value={trTimeline}
                              onChange={(e) => setTrTimeline(e.target.value)}
                              className={`rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 outline-none focus:border-accent-teal ${trTimeline ? "text-ink" : "text-dark-grayish-blue"}`}
                            >
                              <option value="">{t.trTimeline}</option>
                              {t.trTimelineOpts.map((opt, index) => (
                                <option key={index} value={opt} className="text-[#062A4F]">{opt}</option>
                              ))}
                            </select>
                          </div>
                          <div className="flex flex-col gap-2.5 sm:col-span-1 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.budgetLabel} </label>
                            <input
                              type="text"
                              value={trBudget}
                              onChange={(e) => setTrBudget(e.target.value)}
                              placeholder={t.trBudget}
                              className="rounded-md border border-hairline bg-white px-3.5 py-2.5 text-[13px] leading-1 text-[#062A4F] outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                          <div className="flex flex-col gap-2.5 col-span-2">
                            <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.additionalCommentsLabel} </label>
                            <textarea
                              value={trMessage}
                              onChange={(e) => setTrMessage(e.target.value)}
                              placeholder={t.additionalInfoPlaceholder}
                              rows={3}
                              className="rounded-md min-h-27.75 border border-hairline bg-white px-3.5 py-2.5 pt-3.5 text-[13px] leading-[1.2] text-[#062A4F] outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                            />
                          </div>
                        </div>
                      </div>
                      <div className="sm:px-10 xs:px-6 px-4 pt-6">
                        <p className="mt-2 text-xs font-medium text-black mb-5">{t.submitNote}</p>
                        <div className="flex items-center justify-end">
                          <button
                            type="button"
                            onClick={savePatientInquiry}
                            className="group transition-all  duration-500 hover:bg-accent-teal  flex items-center gap-1.75 cursor-pointer rounded-full bg-accent-blue text-cream font-semibold px-6 py-4 text-[13px] w-fit"
                          >
                            {t.submitButton}
                            <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </section>
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="the-problem" className="relative z-10 py-10 sm:py-15 md:py-22 lg:py-28 bg-cream">
            <div className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-9 sm:gap-12 md:gap-14 md:grid-cols-12 lg:gap-20">
              <div className="md:col-span-6">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.problemSectionSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.problemSectionTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.problemSectionDescription}</p>
              </div>
              <div className="md:col-span-6 md:border-l border-hairline md:pl-10">
                <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase sm:mb-6 mb-1 block">{t.whereCareBreaksDownTitle}</span>
                {[
                  {
                    icon: MapPin,
                    ...t.whereCareBreaksDownItems[0],
                  },
                  {
                    icon: Pill,
                    ...t.whereCareBreaksDownItems[1],
                  },
                  {
                    icon: Languages,
                    ...t.whereCareBreaksDownItems[2],
                  },
                  {
                    icon: CalendarClock,
                    ...t.whereCareBreaksDownItems[3],
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <div key={title} className="border-b border-hairline py-5 flex gap-5 items-center last:border-0">
                    <div className="flex h-9 w-9 border border-hairline  bg-white items-center justify-center rounded-sm  text-accent-blue">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium font-display mb-1">{title}</h3>
                      <p className="text-sm font-medium leading-[1.572] text-dark-grayish-blue">{description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="passport" className="relative z-10 py-10 sm:py-15 md:py-22 lg:py-28 pb-20 sm:pb-20 border-t border-b border-hairline bg-white">
            <div className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-6 sm:gap-9 md:gap-14 md:grid-cols-12 lg:gap-14">
              <div className="md:col-span-6 md:order-1 order-2">
                <div className="shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)] relative">
                  <Image src={HealthPassport} alt="health-passport" className="w-full" />
                  <div className="max-w-65 w-full z-99 bg-white rounded-sm absolute shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)] p-5 pr-7 -bottom-5.75 sm:-right-5.75 right-0 border border-hairline">
                    <div className="flex gap-3  mb-3.25">
                      <Lock className="w-3.5 h-3.5 text-accent-blue " />
                      <h3 className="uppercase text-[11px] text-dark-grayish-blue tracking-[0.02016em]">{t.consentBasedTitle}</h3>
                    </div>
                    <p className="font-serif italic sm:text-[15px] text-xs tracking-[0.02016em] text-black">{t.consentBasedDescription}</p>
                  </div>
                </div>
              </div>
              <div className="md:col-span-6 md:order-2 order-1">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.healthPassportSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.healthPassportTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.healthPassportDescription}</p>
                <div className="mt-8 flex gap-5 flex-col after:content-[''] after:z-[-1] relative after:absolute after:w-px after:h-[calc(100%-24px)] after:bg-accent-blue after:left-3">
                  {t.healthPassportFeatures.map(({ title, description }) => (
                    <div key={title} className="flex items-start gap-3 last:after:content-[''] last:after:z-1 relative last:after:absolute last:after:w-px last:after:h-full last:after:bg-cream last:after:left-3">
                      <div className="text-accent-blue bg-cream relative z-10">
                        <CircleCheck />
                      </div>
                      <div>
                        <h3 className="font-display font-medium text-base text-ink leading-[1.75] mb-2">{title}</h3>
                        <p className=" text--base leading-snug text-dark-grayish-blue">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="clinics" className="relative z-10 py-10 sm:py-15 md:py-22 lg:py-28 bg-cream">
            <div className="max-w-360 mx-auto sm:px-8 px-4  grid grid-cols-1 gap-6 sm:gap-9 md:gap-14 md:grid-cols-12 lg:gap-16">
              <div className="laptop:col-span-5 col-span-6">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.clinicMatchingSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.clinicMatchingTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.clinicMatchingDescription}</p>
                <button
                  type="button"
                  className="group hover:bg-accent-teal transition-all  duration-500 flex mt-8 items-center gap-1.75 cursor-pointer rounded-full bg-accent-blue text-cream font-semibold px-6 py-4 text-[13px]  w-fit"
                >
                  {t.submitButton}
                  <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
                </button>
              </div>
              <div className="laptop:col-span-7 col-span-6">
                {t.clinicMatchingFeatures.map((item) => (
                  <div key={item.letter} className="flex items-center laptop:gap-6 laptop:py-10 py-5  border-t border-hairline last:border-b">
                    <div className="laptop:max-w-22.5 max-w-15 w-full laptop:text-[68px] text-[48px] font-medium italic text-accent-blue font-serif leading-normal ">{item.letter}</div>
                    <div>
                      <h3 className="lapop:text-[22px] text-lg font-display font-semibold sm:mb-3 mb-1">{item.title}</h3>
                      <p className="laptop:text-base text-sm font-medium text-dark-grayish-blue">{item.description}</p>

                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="patient-trust" className="relative py-10 sm:py-15 md:py-22 lg:py-28 bg-cream">
            <div className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-6 sm:gap-9 md:gap-14 laptop:grid-cols-12 lg:gap-16 mb-10">
              <div className="laptop:col-span-5">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.transparencySubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.transparencyTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.transparencyDescription}</p>
              </div>
              <div className="laptop:col-span-7 grid min-[575px]:grid-cols-3 gap-4">
                {[
                  {
                    icon: GitCompare,
                    ...t.transparencyFeatures[0],
                  },
                  {
                    icon: ListChecks,
                    ...t.transparencyFeatures[1],
                  },
                  {
                    icon: UserCheck,
                    ...t.transparencyFeatures[2],
                  },
                  {
                    icon: Eye,
                    ...t.transparencyFeatures[3],
                  },
                ].map(({ icon: Icon, title, description }, index) => (
                  <div
                    key={title}
                    className={`border border-hairline rounded-[15px] bg-white md:p-6 p-4 ${index === 0 || index === 3 ? "min-[575px]:col-span-2" : "col-span-1"
                      }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-sm border mb-3 border-hairline bg-white text-accent-blue">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium font-display mb-3">{title}</h3>
                      <p className="text-sm font-medium leading-[1.572] text-dark-grayish-blue">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="max-w-360 mx-auto sm:px-8 px-4">
              <div className="md:p-8 p-5 bg-dark-teal rounded-[15px] flex sm:flex-nowrap flex-wrap justify-between items-center gap-5">
                <p dangerouslySetInnerHTML={{ __html: t.patientJourneyTitle }} className="text-xl font-display font-medium text-cream" />
                <div className=" bg-white rounded-full flex gap-4.75 uppercase tracking-[0.2869em] text-[11px] font-semibold text-accent-blue py-2 px-4 items-center max-w-44.25 w-full"> <span className="max-w-1.5 w-full h-1.5 bg-accent-blue rounded-full "></span> {t.patientJourneySubtitle}</div>
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="assistant" className="relative py-10 sm:py-15 md:py-22 lg:py-28 bg-cream">
            <div className="max-w-360 mx-auto sm:px-8 px-4 grid grid-cols-1 gap-8 sm:gap-10 md:gap-7 laptop:gap-14 md:grid-cols-12 lg:gap-16">
              <div className="laptop:col-span-5 md:col-span-6">
                <div className="flex items-center gap-3">
                  <span className="max-w-9 w-full bg-ink h-px"></span>
                  <span className="font-display text-[11px] tracking-[0.25em] text-dark-grayish-blue font-semibold uppercase ">{t.aiSupportSubtitle}</span>
                </div>
                <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.aiSupportTitle }}></h2>
                <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.aiSupportDescription}</p>
                <div className="sm:mt-10 mt-5">
                  {t.aiSupportFeatures.map(({ title, description }) => (
                    <div
                      key={title}
                      className="border-t border-hairline last:border-b py-5 grid xs:grid-cols-12 xs:gap-4 gap-2"
                    >
                      <h3 className="uppercase  font-display text-sm  font-semibold tracking-[0.16em] text-accent-blue xs:col-span-4">
                        {title}
                      </h3>

                      <p className="text-sm leading-[1.572] text-dark-grayish-blue xs:col-span-8">
                        {description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="laptop:col-span-7 md:col-span-6">
                <div className="rounded-[10px] border border-hairline bg-white">
                  <div className="">
                    <div className="flex items-center justify-between border-b border-[#DCEAF7] py-4 px-6">
                      <div className="flex gap-3 items-center ">
                        <div className="flex h-9 w-9 items-center justify-center rounded-sm border mb-3 border-hairline bg-white text-accent-blue">
                          <GitCompare className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="font-display text-sm font-semibold text-ink">{t.assistantBadge}</h2>
                          <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent-teal block"></span><p className="text-xs text-dark-grayish-blue">{t.assistantTagline}</p></div>
                        </div>
                      </div>
                      <div>
                        <Sparkles className="w-4 h-h text-accent-teal" />
                      </div>
                    </div>

                    <div className="h-80 space-y-4 overflow-y-auto sm:px-7 p-4  sm:py-6 ">
                      <div className="max-w-[90%] text-sm leading-6 text-[#062A4F]">
                        {t.chatGreeting}
                      </div>

                      {chatMessages.map((msg, index) => (
                        <div
                          key={`${msg.role}-${index}`}
                          className={
                            msg.role === "user"
                              ? "ml-auto max-w-[85%] rounded-[10px] bg-ink sm:p-4  p-3  text-sm font-medium  leading-6 text-cream"
                              : "max-w-[90%] py-4 text-sm leading-6 text-[#062A4F]"
                          }
                        >
                          {msg.text === "..." ? (
                            <span className="inline-flex gap-1">
                              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-blue [animation-delay:-0.3s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-blue [animation-delay:-0.15s]" />
                              <span className="h-2 w-2 animate-bounce rounded-full bg-accent-blue" />
                            </span>
                          ) : msg.role === "assistant" ? (
                            <div className="markdown-chat space-y-2"><ReactMarkdown>{msg.text}</ReactMarkdown></div>
                          ) : (
                            msg.text
                          )}
                        </div>
                      ))}
                      <div ref={chatEndRef} />
                    </div>
                    {chatMessages.length <= 1 && (
                      <div className="px-4 py-3">
                        <div className="flex flex-wrap gap-2 justify-left items-center">
                          {t.suggestedQuestions.map((question) => (
                            <button
                              key={question}
                              onClick={() => handleSuggestionClick(question)}
                              className="rounded-full border border-accent-blue px-3 py-1.5 text-[13px] text-accent-blue hover:bg-accent-blue hover:text-white transition-all duration-500 cursor-pointer"
                            >
                              {question}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-3 sm:flex-row border-t border-hairline">
                      <div className="flex gap-3 w-full py-3 px-4 items-center">
                        <input
                          type="text"
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                          placeholder={t.chatPlaceholder}
                          className="w-full flex-1 rounded-[10px] bg-cream py-3.25 leading-normal px-3 text-sm  text-ink outline-none placeholder:text-dark-grayish-blue"
                        />
                        <button type="button" onClick={() => sendMessage()} className="cursor-pointer rounded-full bg-accent-blue hover:bg-accent-teal transition-all duration-500 px-4.25 py-2.5 text-xs font-semibold text-white flex items-center gap-1.5">
                          {t.sendButton}
                          <Send className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="trust" className="relative py-10 sm:py-15 md:py-22 lg:py-28 bg-dark-teal">
            <div className="max-w-360 mx-auto sm:px-8 px-4">
              <div className="grid grid-cols-1 gap-6 laptop:grid-cols-12 lg:gap-16 sm:mb-14 mb-6">
                <div className="laptop:col-span-5">
                  <div className="flex items-center gap-3">
                    <span className="max-w-9 w-full bg-accent-teal h-px"></span>
                    <span className="font-display text-[11px] tracking-[0.25em] text-cream/60 font-semibold uppercase ">{t.privacyTrustSubtitle}</span>
                  </div>
                  <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-cream font-display sm:mt-6 mt-4 tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.privacyTrustTitle }}></h2>
                </div>
                <div className="laptop:col-span-7">
                  <p className="laptop:mt-5 sm:text-base text-sm leading-normal text-cream/75 lg:max-w-143.25 w-full">{t.privacyTrustDescription}</p>
                </div>
              </div>
              <div className="grid sm:grid-cols-3 bg-cream/12 gap-px rounded-sm overflow-hidden">
                {[
                  {
                    icon: ShieldCheck,
                    ...t.privacyTrustFeatures[0],
                  },
                  {
                    icon: ShieldCheck,
                    ...t.privacyTrustFeatures[1],
                  },
                  {
                    icon: Stethoscope,
                    ...t.privacyTrustFeatures[2],
                  },
                ].map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="bg-ink-warm md:p-8 p-5"
                  >
                    <div className="flex justify-between items-center">
                      <div className="mb-7 flex h-10 w-10 items-center justify-center rounded-sm bg-cream/10 text-accent-teal">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-cream/40 font-serif font-medium">✓</p>
                    </div>

                    <h3 className="mb-2 font-display text-base text-cream font-medium">
                      {title}
                    </h3>

                    <p className="text-sm leading-[1.572] text-cream/75 ">
                      {description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.8, ease: "easeOut" }} id="waitlist" className="relative py-10 sm:py-15 md:py-22 lg:py-28 bg-cream">
            <div className="max-w-360 mx-auto sm:px-8 px-4">
              <div className="overflow-hidden grid laptop:grid-cols-12 gap-0 border border-hairline rounded-sm shadow-[0px_1px_3px_rgba(6,28,46,0.0509804),0px_24px_60px_-20px_rgba(6,28,46,0.180392)]">
                <div className="laptop:col-span-5">
                  <div className="relative laptop:rounded-[4px_0_0_4px] rounded-[4px_4px_0_0px] laptop:h-full sm:h-125">
                    <div className="absolute h-full w-full flex justify-between flex-col xl:p-10 md:p-8 sm:p-6 p-5 z-99">
                      <div className="flex items-center gap-3">
                        <span className="max-w-9 w-full bg-accent-teal h-px"></span>
                        <span className="font-display text-[11px] tracking-[0.25em] text-cream/60 font-semibold uppercase ">{t.earlyAccessSubtitle}</span>
                      </div>
                      <div >
                        <h2 className="font-serif italic sm:text-[26px] text-lg tracking-[0.02016em] mb-5 text-cream">{t.earlyAccessSupportingText}</h2>
                        <span className="font-display text-[12px] tracking-[0.25em] text-cream/60 font-medium uppercase">{t.earlyAccessBadge}</span>
                      </div>
                    </div>
                    <div className="absolute laptop:rounded-[4px_0_0_4px] rounded-[4px_4px_0_0px] bg-[linear-gradient(139.86deg,rgba(6,28,46,0.9)_9.09%,rgba(6,28,46,0.75)_33.73%,rgba(6,28,46,0.6)_99.11%)] w-full h-full"></div>
                    <Image src={Access} alt="Early access" className="w-full laptop:rounded-[4px_0_0_4px] rounded-[4px_4px_0_0px] h-full object-cover" />
                  </div>
                </div>
                <div className="laptop:col-span-7 bg-white">
                  <div className="laptop:p-14 md:p-9 xs:p-6 p-4 ">
                    <h2 className="text-[24px] sm:text-[28px] md:text-[30px] laptop:text-[38px] lg:text-[44px] font-semibold leading-[1.08] text-ink font-display tracking-[-0.0136em]" dangerouslySetInnerHTML={{ __html: t.earlyAccessTitle }}></h2>
                    <p className="laptop:my-4 my-2 sm:text-base text-sm leading-normal text-dark-grayish-blue w-full">{t.earlyAccessDescription}</p>
                    <span className="tracking-[0.2869em] uppercase text-[11px] text-[#404F5D] font-display font-semibold block mb-2.5">{t.earlyAccessRoleLabel}</span>
                    <div className="mt-2 grid grid-cols-3 sm:flex-nowrap flex-wrap justify-center gap-3 max-w-112.5 w-full ">
                      <RoleButton
                        value="patient"
                        label={t.rolePatient}
                        icon={User}
                        dark
                      />
                      <RoleButton
                        value="doctor"
                        label={t.roleDoctor}
                        icon={Stethoscope}
                        dark
                      />
                      <RoleButton
                        value="clinic"
                        label={t.roleClinic}
                        icon={Hospital}
                        dark
                      />
                    </div>
                    <div className="grid xs:grid-cols-2 xs:gap-4.5 gap-6 mt-6">
                      <div className="flex flex-col  gap-2.25 ">
                        <label htmlFor="" className="text-[11px] font-semibold tracking-[0.1869em] text-dark-grayish-blue uppercase">{t.name}</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder={t.name}
                          className=" border-b border-hairline py-2.5 text-[15px] text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                        />

                      </div>
                      <div className="flex flex-col  gap-2.25 ">
                        <label htmlFor="" className="text-[11px] font-semibold tracking-[0.1869em] text-dark-grayish-blue uppercase">{t.email}</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t.email}
                          className="border-b border-hairline py-2.5 text-[15px] text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                        />
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-5 justify-between items-center">
                      <p className="text-xs text-dark-grayish-blue font-medium">{t.earlyAccessPrivacyNotice}</p>
                      <button
                        type="button"
                        onClick={saveEmail}
                        className="flex items-center gap-1.75 cursor-pointer rounded-full group hover:bg-accent-teal duration-500   bg-accent-blue text-cream font-semibold px-6 py-4 text-[13px] w-fit"
                      >
                        {t.joinEarlyAccess}
                        <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </motion.section>
        </main>
        <footer className="border-t border-hairline bg-cream sm:py-14 py-10 pb-6">
          <div className="max-w-360 mx-auto sm:px-8 px-4 grid xs:grid-cols-3 sm:gap-10 gap-8 md:grid-cols-5">
            <div className="md:col-span-2 xs:col-span-3">
              <div className="flex items-center gap-2.5">
                <Link href="/" onClick={() => scrollTo("home")}>
                  <Image
                    src="/logo.svg"
                    alt="Adamiani.AI"
                    width={156}
                    height={28}
                    className=""
                  />
                </Link>
              </div>
              <p className="mt-5 max-w-sm font-serif text-[15px] italic leading-relaxed text-dark-grayish-blue">
                {t.footerDescription}
              </p>
              <div className="mt-5 flex">
                {["en", "ru", "ka"].map((lang: any, index) => (
                  <div
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`cursor-pointer text-[11px] font-medium ${language === lang ? "text-ink" : "text-dark-grayish-blue"}`}
                  >
                    {lang.toUpperCase()}
                    {index !== 2 && (
                      <span className="pl-1.25 pr-1.5 text-hairline">/</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 font-semibold">{t.productSection.title}</h3>
              <ul className="space-y-2">
                {t.productSection.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => scrollTo(link.href)}
                      className="text-sm cursor-pointer text-left text-dark-grayish-blue transition-colors hover:text-accent-blue"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            {t.footerSections.map((section) => (
              <div key={section.title}>
                <h3 className="mb-4 font-semibold">{section.title}</h3>

                <ul className="space-y-2">
                  {section.links.map((link) => (
                    <li key={link.label}>
                      <a
                        href={link.href}
                        className="text-sm text-dark-grayish-blue transition-colors hover:text-accent-blue"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="max-w-360 mx-auto sm:px-8 px-4 mt-12 flex flex-col items-start justify-between gap-3 border-t border-hairline xs:pt-6 pt-4 text-[12px] text-dark-grayish-blue md:flex-row md:items-center">
            <span className=" ">  © {new Date().getFullYear()} {t.footerCopyright}</span>
            <span className="flex items-center gap-2">
              <Languages className="h-3.5 w-3.5 text-accent-blue" />
              {t.footerBadge}
            </span>
          </div>
        </footer>
        {showRegisterModal && (
          <div className="fixed inset-0 z-999 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#062A4F]/40 backdrop-blur-sm" onClick={() => setShowRegisterModal(false)} />
            <div className="relative z-10 w-full max-w-md rounded-[10px] bg-white p-5  shadow-2xl xs:p-8">
              <button type="button" onClick={() => setShowRegisterModal(false)} className="absolute right-5 top-5 text-[#7A8FA5] transition hover:text-[#062A4F]">
                <X className="h-5 w-5" />
              </button>
              <div className=" bg-cream border border-hairline rounded-full flex gap-4.75 uppercase tracking-[0.2869em] text-[11px] font-semibold text-accent-blue py-2 px-4 items-center max-w-44.25 w-full"> <span className="max-w-1.5 w-full h-1.5 bg-accent-blue rounded-full "></span> {t.modalBadge}</div>
              <h3 className="sm:text-[24px] text-xl font-semibold leading-[1.08] text-ink font-display sm:mt-6 mt-4 tracking-[-0.0136em]">{t.modalTitle}</h3>
              <p className="laptop:mt-5 mt-3 sm:text-base text-sm leading-normal text-dark-grayish-blue lg:max-w-143.25 w-full">{t.modalText}</p>
              <div className="mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-3 flex-wrap justify-center gap-2">
                  <RoleButton
                    value="patient"
                    label={t.rolePatient}
                    icon={User}
                    dark
                  />
                  <RoleButton
                    value="doctor"
                    label={t.roleDoctor}
                    icon={Stethoscope}
                    dark
                  />
                  <RoleButton
                    value="clinic"
                    label={t.roleClinic}
                    icon={Hospital}
                    dark
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.nameLabel} <span className="text-accent-blue">*</span></label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder={t.name}
                      className="rounded-md border border-hairline bg-cream px-3.5 py-2.5 text-[13px] leading-1 text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                    />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <label htmlFor="" className="text-ink font-medium text-sm leading-[1.2]">{t.email} <span className="text-accent-blue">*</span></label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t.email}
                      className="rounded-md border border-hairline bg-cream px-3.5 py-2.5 text-[13px] leading-1 text-ink outline-none placeholder:text-dark-grayish-blue focus:border-accent-teal"
                    />
                  </div>

                </div>
                <div className="flex justify-end">
                  <button type="button" onClick={saveEmail} className="group transition-all  duration-500 hover:bg-accent-teal  flex items-center gap-1.75 cursor-pointer rounded-full bg-accent-blue text-cream font-semibold px-6 py-4 text-[13px] w-fit">
                    {t.modalButton}
                    <ArrowRight className="w-4 h-4 transform transition-transform duration-500 ease-in-out group-hover:translate-x-1" />
                  </button>

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
