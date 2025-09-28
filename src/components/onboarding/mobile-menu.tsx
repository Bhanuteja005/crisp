import { cn } from "../../functions/cn";
import { useClickOutside } from "../../hooks/use-click-outside";
import { motion } from "framer-motion";
import { ArrowRightIcon } from "lucide-react";
import { Link } from "react-router-dom";
import React from 'react';
import { Button } from "../ui/button";

interface Props {
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileMenu = ({ isOpen, setIsOpen }: Props) => {

    const ref = useClickOutside(() => setIsOpen(false));

    const variants = {
        open: { opacity: 1, y: 20 },
        closed: { opacity: 0, y: 0 },
    };

    return (
        <div
            ref={ref}
            className={cn(
                "absolute top-12 inset-x-0 size-full p-4 z-20 bg-inherit flex flex-1",
                isOpen ? "flex" : "hidden"
            )}
        >
            <motion.div
                initial="closed"
                animate={isOpen ? "open" : "closed"}
                variants={variants}
                transition={{
                    type: "spring",
                    bounce: 0.15,
                    duration: 0.5,
                }}
                className="size-full flex flex-col justify-center items-center"
            >
                <div className="text-center space-y-6">
                    <h2 className="text-2xl font-bold text-black">Ready to Start?</h2>
                    <p className="text-gray-600 text-lg">Begin your AI-powered interview experience</p>
                    <Button 
                        onClick={() => setIsOpen(false)}
                        size="lg" 
                        asChild 
                        className="bg-black text-white hover:bg-gray-800 px-8 py-4 text-lg"
                    >
                        <Link to="/interview" className="flex items-center gap-3">
                            Get Started
                            <ArrowRightIcon className="w-5 h-5" />
                        </Link>
                    </Button>
                </div>
            </motion.div>
        </div>
    )
};

export default MobileMenu
