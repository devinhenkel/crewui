#!/usr/bin/env python3
"""
Test script to verify CrewAI integration after Python 3.12 migration.
"""

import sys
import importlib

def test_python_version():
    """Test that we're running Python 3.12."""
    version = sys.version_info
    print(f"🐍 Python version: {version.major}.{version.minor}.{version.micro}")
    
    if version.major == 3 and version.minor == 12:
        print("✅ Python 3.12 detected - compatible with CrewAI")
        return True
    else:
        print(f"❌ Python {version.major}.{version.minor} detected - CrewAI requires Python 3.12")
        return False

def test_crewai_import():
    """Test that CrewAI can be imported."""
    try:
        import crewai
        print(f"✅ CrewAI imported successfully - version: {crewai.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import CrewAI: {e}")
        return False

def test_langchain_import():
    """Test that LangChain can be imported."""
    try:
        import langchain
        print(f"✅ LangChain imported successfully - version: {langchain.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import LangChain: {e}")
        return False

def test_openai_import():
    """Test that OpenAI can be imported."""
    try:
        import openai
        print(f"✅ OpenAI imported successfully - version: {openai.__version__}")
        return True
    except ImportError as e:
        print(f"❌ Failed to import OpenAI: {e}")
        return False

def test_basic_crewai_functionality():
    """Test basic CrewAI functionality."""
    try:
        from crewai import Agent, Task, Crew
        print("✅ Basic CrewAI classes imported successfully")
        
        # Test creating a simple agent
        agent = Agent(
            role="Test Agent",
            goal="Test the CrewAI integration",
            backstory="A test agent for verification",
            verbose=True,
            allow_delegation=False
        )
        print("✅ Agent creation successful")
        
        return True
    except Exception as e:
        print(f"❌ Basic CrewAI functionality test failed: {e}")
        return False

def main():
    """Run all tests."""
    print("🧪 Testing CrewAI Integration for Python 3.12 Migration")
    print("=" * 60)
    
    tests = [
        ("Python Version", test_python_version),
        ("CrewAI Import", test_crewai_import),
        ("LangChain Import", test_langchain_import),
        ("OpenAI Import", test_openai_import),
        ("Basic CrewAI Functionality", test_basic_crewai_functionality),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 Testing: {test_name}")
        print("-" * 40)
        if test_func():
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print("\n" + "=" * 60)
    print(f"📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! CrewAI integration is working correctly.")
        return 0
    else:
        print("❌ Some tests failed. Please check the migration.")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 