import { cn } from "../../functions/cn";
import { ArrowRightIcon, XIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from 'react';
import Icons from "../global/icons";
import Wrapper from "../global/wrapper";
import { Button } from "../ui/button";
import MobileMenu from "./mobile-menu";

const Navbar = () => {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <header
            className={cn(
                "fixed top-0 inset-x-0 mx-auto w-full z-[100]",
                isOpen ? "h-screen" : "h-auto"
            )}
        >
            <div className="max-w-6xl mx-auto px-2 md:px-12 pt-1">
                <Wrapper className="backdrop-blur-lg rounded-xl lg:rounded-2xl border border-[rgba(124,124,124,0.2)] px-4 md:px-2 flex items-center justify-start">
                    <div className="flex items-center justify-between w-full sticky py-2 lg:py-3 inset-x-0">
                        <div className="flex items-center flex-1 lg:flex-none">
                            <Link to="/" className="text-lg font-semibold text-black flex items-center gap-2">
                                <Icons.icon className="w-auto h-5" />
                                <span className="hidden sm:block">Crisp Interview</span>
                            </Link>
                            {/* No menu items needed - simplified */}
                        </div>
                        <div className="items-center flex gap-2 lg:gap-4">
                            <Button size="sm" asChild className="hidden sm:flex bg-black text-white hover:bg-gray-800">
                                <Link to="/interview">
                                    Start Interview
                                    <ArrowRightIcon className="w-4 h-4 ml-2 hidden lg:block" />
                                </Link>
                            </Button>
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setIsOpen((prev) => !prev)}
                                className="lg:hidden p-2 w-8 h-8"
                            >
                                {isOpen ? <XIcon className="w-4 h-4 duration-300" /> : <Icons.menu className="w-3.5 h-3.5 duration-300" />}
                            </Button>
                        </div>
                    </div>
                    <MobileMenu isOpen={isOpen} setIsOpen={setIsOpen} />
                </Wrapper>
            </div>
        </header>
    )
};

export default Navbar