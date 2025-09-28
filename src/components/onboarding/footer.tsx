import Container from "../global/container";
import Icons from "../global/icons";
import Wrapper from "../global/wrapper";
import { Particles } from "../ui/particles";

const Footer = () => {
    return (
        <footer className="w-full py-10 relative">
            <Container>
                <Wrapper className="relative flex flex-col md:flex-row justify-between pb-40 overflow-hidden footer">
                    <Particles
                        className="absolute inset-0 w-full -z-10"
                        quantity={40}
                        ease={10}
                        color="#d4d4d8"
                        refresh
                    />
                    <div className="flex flex-col items-start max-w-48">
                        <div className="flex items-center gap-2">
                            <Icons.icon className="w-5 h-5" />
                            <span className="text-xl font-medium text-black">
                                Swipe AI
                            </span>
                        </div>
                    </div>
                </Wrapper>
            </Container>
            <Container>
                <Wrapper className="pt-10 flex items-center justify-between relative">
                    <p className="text-sm text-black">
                        &copy; {new Date().getFullYear()} Swipe AI. All rights reserved.
                    </p>
                </Wrapper>
            </Container>
        </footer>
    )
};

export default Footer
