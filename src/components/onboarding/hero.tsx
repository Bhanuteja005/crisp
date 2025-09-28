import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { BlurText } from "../ui/blur-text";
import { Button } from "../ui/button";
import Container from "../global/container";

const Hero = () => {
    return (
        <div className="flex flex-col items-center text-center w-full max-w-5xl mx-auto z-40 relative pt-16">
            <Container delay={0.0} simple>
                <div className="pl-2 pr-1 py-1 rounded-full border border-foreground/10 hover:border-foreground/15 backdrop-blur-lg cursor-pointer flex items-center gap-2.5 select-none w-max mx-auto">
                    <div className="w-3.5 h-3.5 rounded-full bg-primary/40 flex items-center justify-center relative">
                        <div className="w-2.5 h-2.5 rounded-full bg-primary/60 flex items-center justify-center animate-ping">
                            <div className="w-2.5 h-2.5 rounded-full bg-primary/60 flex items-center justify-center animate-ping"></div>
                        </div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                        </div>
                    </div>
                    <span className="inline-flex items-center justify-center gap-2 animate-text-gradient animate-background-shine bg-gradient-to-r from-[#b2a8fd] via-[#8678f9] to-[#c7d2fe] bg-[200%_auto] bg-clip-text text-sm text-black">
                        Build for the future
                        <span className="text-xs text-black px-1.5 py-0.5 rounded-full bg-gradient-to-b from-foreground/20 to-foreground/10 flex items-center justify-center">
                            What&apos;s new
                            <ArrowRightIcon className="w-3.5 h-3.5 ml-1 text-black" />
                        </span>
                    </span>
                </div>
            </Container>
            <BlurText
                word={"AI-Powered Interview\n Assistant (Crisp)"}
                className="text-3xl sm:text-5xl lg:text-6xl xl:text-7xl text-black py-2 md:py-0 lg:!leading-snug font-bold tracking-[-0.0125em] mt-4 font-heading"
            />
            <Container delay={0.1}>
                <p className="text-sm sm:text-base lg:text-lg mt-2 text-black max-w-2xl mx-auto">
                    Revolutionary AI-powered interview platform with resume parsing, timed assessments, and intelligent scoring. <span className="hidden sm:inline">Perfect for evaluating full-stack React/Node.js developers with real-time chat interface and comprehensive candidate dashboard.</span>
                </p>
            </Container>
            <Container delay={0.2}>
                <div className="flex items-center justify-center md:gap-x-6 mt-4">
                    <Button asChild size="lg" className="bg-black text-white hover:bg-gray-800">
                        <Link to="/interview">
                            Get Started
                        </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="hidden md:flex text-black">
                        <a href="#features">
                            Learn More
                        </a>
                    </Button>
                </div>
            </Container>
            <Container delay={0.3}>
                <div className="relative mx-auto max-w-7xl rounded-xl lg:rounded-[32px] border border-neutral-200/50 p-2 backdrop-blur-lg border-neutral-700 bg-neutral-800/50 md:p-4 mt-6">
                    <div className="absolute top-1/4 left-1/2 -z-10 gradient w-3/4 -translate-x-1/2 h-1/4 -translate-y-1/2 inset-0 blur-[10rem]"></div>

                    <div className="rounded-lg lg:rounded-[24px] border p-2 border-neutral-700 bg-black">
                        <div className="w-full h-[400px] lg:h-[600px] bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 rounded-lg lg:rounded-[20px] flex items-center justify-center">
                            <div className="text-black text-center">
                                <h3 className="text-2xl font-bold mb-2">AI-Powered Interview Platform</h3>
                                <p className="text-black">Experience the future of technical assessments</p>
                            </div>
                        </div>
                    </div>
                </div>
            </Container>
        </div>
    )
};

export default Hero