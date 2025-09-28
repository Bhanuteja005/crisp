import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from "../../components/ui/navigation-menu";
import { CalendarRangeIcon, CircleHelp, HashIcon, Newspaper, UsersIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import React from 'react';
import Icons from "../global/icons";

interface Props {
    title: string;
    href: string;
    children: React.ReactNode;
    icon: React.ReactNode;
}

const Menu = () => {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <Link to="/docs" className="h-10 px-4 py-2 text-sm font-normal rounded-md text-black hover:text-black w-max hover:bg-none">
                        How it works
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-black hover:text-black">
                        Features
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid rounded-3xl gap-3 p-4 md:w-[400px] lg:w-[500px] xl:w-[550px] lg:grid-cols-[.75fr_1fr]">
                            <li className="row-span-3">
                                <NavigationMenuLink asChild>
                                    <Link
                                        to="/"
                                        className="flex flex-col justify-end w-full h-full p-4 no-underline rounded-lg outline-none select-none bg-gradient-to-tr from-accent to-accent/50 focus:shadow-md"
                                    >
                                        <Icons.icon className="w-6 h-6" />
                                        <div className="my-2 text-lg font-normal">
                                            Luro AI
                                        </div>
                                        <p className="text-sm text-black">
                                            Your ultimate social media management tool
                                        </p>
                                    </Link>
                                </NavigationMenuLink>
                            </li>
                            <Item title="Content Calendar" href="/features/content-calendar" icon={<CalendarRangeIcon className="w-5 h-5" />}>
                                Plan and visualize your content strategy.
                            </Item>
                            <Item title="Hashtag Manager" href="/features/hashtag-manager" icon={<HashIcon className="w-5 h-5" />}>
                                Research and track trending hashtags.
                            </Item>
                            <Item title="Competitor Analysis" href="/features/competitor-analysis" icon={<UsersIcon className="w-5 h-5" />}>
                                Monitor and analyze competitor performance.
                            </Item>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link to="/pricing" className="h-10 px-4 py-2 text-sm font-normal rounded-md text-black hover:text-black w-max hover:bg-none">
                        Pricing
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <Link to="/integrations" className="h-10 px-4 py-2 text-sm font-normal rounded-md text-black hover:text-black w-max hover:bg-none">
                        Integrations
                    </Link>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuTrigger className="text-black hover:text-black">
                        Resources
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-[400px] gap-3 p-4 md:w-[400px] md:grid-cols-2 lg:w-[500px] xl:w-[500px]">
                            <Item title="Blog" href="/resources/blog" icon={<Newspaper className="w-5 h-5" />}>
                                Read our latest articles and updates.
                            </Item>
                            <Item title="Support" href="/resources/support" icon={<CircleHelp className="w-5 h-5" />}>
                                Get help with any issues you may have.
                            </Item>
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    )
};

const Item = ({ title, href, children, icon, ...props }: Props) => {
    return (
        <li>
            <NavigationMenuLink asChild>
                <Link
                    to={href}
                    {...props}
                    className="grid grid-cols-[.15fr_1fr] select-none space-y-1 rounded-lg p-3 leading-none no-underline outline-none transition-colors hover:bg-accent/50 hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground group"
                >
                    <div className="flex items-center mt-1 justify-center p-1 w-8 h-8 rounded-md border border-border/80">
                        {icon}
                    </div>
                    <div className="text-start ml-3">
                        <span className="text-sm group-hover:text-black font-normal leading-none">
                            {title}
                        </span>
                        <p className="text-sm mt-0.5 line-clamp-2 text-black">
                            {children}
                        </p>
                    </div>
                </Link>
            </NavigationMenuLink>
        </li>
    )
};

Item.displayName = "Item";

export default Menu
